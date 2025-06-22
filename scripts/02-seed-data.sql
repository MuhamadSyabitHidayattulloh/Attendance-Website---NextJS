-- Insert sample users
INSERT INTO users (email, name, role) VALUES
  ('admin@school.edu', 'System Administrator', 'admin'),
  ('john.teacher@school.edu', 'John Smith', 'teacher'),
  ('jane.teacher@school.edu', 'Jane Doe', 'teacher'),
  ('alice.student@school.edu', 'Alice Johnson', 'student'),
  ('bob.student@school.edu', 'Bob Wilson', 'student'),
  ('carol.student@school.edu', 'Carol Brown', 'student'),
  ('david.student@school.edu', 'David Lee', 'student'),
  ('emma.student@school.edu', 'Emma Davis', 'student')
ON CONFLICT (email) DO NOTHING;

-- Insert sample classes
INSERT INTO classes (name, description, teacher_id) 
SELECT 
  'Mathematics 101',
  'Introduction to Algebra and Geometry',
  u.id
FROM users u WHERE u.email = 'john.teacher@school.edu'
ON CONFLICT DO NOTHING;

INSERT INTO classes (name, description, teacher_id) 
SELECT 
  'English Literature',
  'Classic and Modern Literature Analysis',
  u.id
FROM users u WHERE u.email = 'jane.teacher@school.edu'
ON CONFLICT DO NOTHING;

-- Enroll students in classes
INSERT INTO student_classes (student_id, class_id)
SELECT s.id, c.id
FROM users s, classes c
WHERE s.role = 'student' AND c.name IN ('Mathematics 101', 'English Literature')
ON CONFLICT (student_id, class_id) DO NOTHING;

-- Insert sample attendance records
INSERT INTO attendance (student_id, class_id, date, status, recorded_by)
SELECT 
  sc.student_id,
  sc.class_id,
  CURRENT_DATE - INTERVAL '7 days',
  CASE 
    WHEN RANDOM() < 0.8 THEN 'present'
    WHEN RANDOM() < 0.9 THEN 'late'
    ELSE 'absent'
  END,
  c.teacher_id
FROM student_classes sc
JOIN classes c ON sc.class_id = c.id
ON CONFLICT (student_id, class_id, date) DO NOTHING;

INSERT INTO attendance (student_id, class_id, date, status, recorded_by)
SELECT 
  sc.student_id,
  sc.class_id,
  CURRENT_DATE - INTERVAL '6 days',
  CASE 
    WHEN RANDOM() < 0.8 THEN 'present'
    WHEN RANDOM() < 0.9 THEN 'late'
    ELSE 'absent'
  END,
  c.teacher_id
FROM student_classes sc
JOIN classes c ON sc.class_id = c.id
ON CONFLICT (student_id, class_id, date) DO NOTHING;

INSERT INTO attendance (student_id, class_id, date, status, recorded_by)
SELECT 
  sc.student_id,
  sc.class_id,
  CURRENT_DATE - INTERVAL '5 days',
  CASE 
    WHEN RANDOM() < 0.8 THEN 'present'
    WHEN RANDOM() < 0.9 THEN 'late'
    ELSE 'absent'
  END,
  c.teacher_id
FROM student_classes sc
JOIN classes c ON sc.class_id = c.id
ON CONFLICT (student_id, class_id, date) DO NOTHING;
