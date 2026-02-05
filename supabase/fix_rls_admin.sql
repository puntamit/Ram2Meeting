-- ฟังก์ชันตรวจสอบสิทธิ์ Admin แบบปลอดภัย (ป้องกัน Infinite Recursion)
-- SECURITY DEFINER ทำให้ฟังก์ชันนี้ทำงานด้วยสิทธิ์ของระบบ ไม่สนใจ RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. แก้ไขสิทธิ์ Profiles: ใช้ฟังก์ชัน is_admin() แทนการ Query ตรงๆ
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
ON profiles
FOR ALL
USING (
  auth.uid() = id OR is_admin()
);

-- 2. แก้ไขสิทธิ์ Bookings: ใช้ฟังก์ชัน is_admin() เพื่อความรวดเร็วและปลอดภัย
DROP POLICY IF EXISTS "Users/Admins can manage bookings" ON bookings;
CREATE POLICY "Users/Admins can manage bookings"
ON bookings
FOR ALL
USING (
  auth.uid() = user_id OR is_admin()
);

-- 3. (แถม) แก้ไขสิทธิ์ Rooms: เผื่อไว้กรณีที่ Rooms เรียก Profiles แล้วเจอปัญหาเดียวกัน
DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;
CREATE POLICY "Admins can manage rooms"
ON rooms
FOR ALL
USING (
  is_admin()
);
