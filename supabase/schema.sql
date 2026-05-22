-- 1. حذف جميع الجداول والوظائف السابقة لتنظيف قاعدة البيانات تماماً (Clean Slate)
DROP TABLE IF EXISTS public.accounting_logs CASCADE;
DROP TABLE IF EXISTS public.password_reset_requests CASCADE;
DROP TABLE IF EXISTS public.server_assignments CASCADE;
DROP TABLE IF EXISTS public.servers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'employee');

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 2. إنشاء جدول المستخدمين (Profiles)
-- تمت إضافة حقل البريد الإلكتروني (email) هنا ليظهر بوضوح وبشكل متزامن مع Supabase Auth
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role DEFAULT 'employee',
  plain_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. دالة الاستماع التلقائي (Trigger Function)
-- تقوم بسحب البريد الإلكتروني تلقائياً من auth.users وتخزينه في جدول profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
  assigned_role public.user_role;
BEGIN
  -- First user check
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;
  
  IF is_first_user THEN
    assigned_role := 'admin'::public.user_role;
  ELSE
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'employee')::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    assigned_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل الـ Trigger عند تسجيل حساب جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. إنشاء جدول السيرفرات (Servers)
-- يخزن معلومات السيرفرات واسم المستخدم وكلمة مرور الـ API بدون تشفير (كما طلبت لعمليات البروكسي)
CREATE TABLE public.servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_name TEXT NOT NULL,
  local_ip TEXT,
  remote_dns_domain TEXT,
  api_port INTEGER DEFAULT 8728,
  username TEXT NOT NULL,
  plain_password TEXT NOT NULL, 
  ssl_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. جدول تعيينات السيرفرات (Server Assignments)
-- لربط الموظف بسيرفر أو سيرفرات محددة (يدعم إظهار سيرفرات معينة لكل موظف)
CREATE TABLE public.server_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(profile_id, server_id)
);

-- 6. جدول سجلات المحاسبة (Accounting Logs / Auditing)
-- كل حركة تمديد أو تجديد يقوم بها الموظف تسجل هنا مع المبلغ المحصل
CREATE TABLE public.accounting_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  server_id UUID REFERENCES public.servers(id) ON DELETE SET NULL,
  action TEXT NOT NULL, 
  target_user TEXT,
  details JSONB,
  revenue_generated DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. جدول طلبات إعادة تعيين كلمة المرور (اختياري)
CREATE TABLE public.password_reset_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);
