/* ============================================
  data.sql - ข้อมูลเริ่มต้น (เพิ่ม display_order และอัปเดต Category)
  ============================================ */

-- ============================================
-- 1. INSERT CATEGORIES (ตามตัวอย่างใหม่)
-- ============================================
INSERT INTO Category (id, name, display_order, is_visible) VALUES 
  ('film_score', 'Film Score', 1, 1),
  ('series_score', 'Series Score', 2, 1),
  ('song_arrangement', 'Song Arrangement', 3, 1),
  ('commercial_music', 'Commercial Music', 4, 1);

-- ============================================
-- 2. INSERT PROJECTS (ข้อมูลเดิม + display_order, อัปเดต category_id)
-- ============================================
INSERT INTO Project (id, title, description, image, category_id, display_order, is_published) VALUES 
  /* Film Score (เดิมคือ music_score) */
  ('score_1', 'Tee yod', 'Music Composer', '/assets/Card 1/tee.avif', 'film_score', 1, 1),
  ('score_2', 'Bangkok breaking 2', 'Music Composer', '/assets/Card 1/bangkok breaking 2.avif', 'film_score', 2, 1),
  ('score_3', 'Spaceless', 'Music Composer', '/assets/Card 1/spaceless.avif', 'film_score', 3, 1),
  ('score_4', '14 Again', 'Music Composer', '/assets/Card 1/14 again.avif', 'film_score', 4, 1),
  ('score_5', 'Love You to Debt', 'Music Composer', '/assets/Card 1/for cash.avif', 'film_score', 5, 1),
  ('score_6', 'Postman', 'Music Composer', '/assets/Card 1/postman.avif', 'film_score', 6, 1),
  ('score_7', 'The X-Treme Riders', 'Music Composer', '/assets/Card 1/The x-treme riders.avif', 'film_score', 7, 1),
  ('score_8', 'Will You Marry Monk?', 'Music Composer', '/assets/Card 1/monk.avif', 'film_score', 8, 1),
  ('score_9', 'The Djinns Curse', 'Music Composer', '/assets/Card 1/Khong Khaeg.avif', 'film_score', 9, 1),
  ('score_10', 'The Cursed Land', 'Music Composer', '/assets/Card 1/the cursed land.avif', 'film_score', 10, 1),
  ('score_11', 'The Elite of Devils', 'Music Composer', '/assets/Card 1/the elite of devils.avif', 'film_score', 11, 1),
  ('score_12', 'Siam Curse', 'Music Composer', '/assets/Card 1/siam curse.avif', 'film_score', 12, 1),
  ('score_13', 'Curse Code', 'Music Composer', '/assets/Card 1/curse code.avif', 'film_score', 13, 1),
  ('score_14', 'Moei : The Promised', 'Music Composer', '/assets/Card 1/moei the promised.avif', 'film_score', 14, 1),
  
  /* Series Score (เดิมคือ series) */
  ('series_1', 'Don''t come home', 'Music Composer', '/assets/Card 2/Don''t Come Home.avif', 'series_score', 1, 1),
  ('series_2', 'I saw you in my dream', 'Music Composer', '/assets/Card 2/I saw you in my dream.avif', 'series_score', 2, 1),
  ('series_3', 'Summer Night', 'Music Composer', '/assets/Card 2/summer night.avif', 'series_score', 3, 1),
  ('series_4', 'Step by Step', 'Music Composer', '/assets/Card 2/step.avif', 'series_score', 4, 1),
  ('series_5', 'Every You Every Me', 'Music Composer', '/assets/Card 2/every you every me.avif', 'series_score', 5, 1),
  ('series_6', 'Bussing Thailand', 'Re-arranger', '/assets/Card 2/bus1.avif', 'series_score', 6, 1),
  ('series_7', 'Jaipusut', 'Music Composer', '/assets/Card 2/Jai Pisoot.avif', 'series_score', 7, 1),
  ('series_8', 'Terror Tuesday : Extreme', 'Music Composer', '/assets/Card 2/Terror Tuesday.avif', 'series_score', 8, 1),
  ('series_9', 'Dear my secretary', 'Music Composer', '/assets/Card 2/dear my secretary.avif', 'series_score', 9, 1),
  ('series_10', 'Boyband The Series', 'Music Composer', '/assets/Card 2/boyband.avif', 'series_score', 10, 1),
  
  /* Song Arrangement */
  ('arrange_1', 'Multibird Concert', 'Re-arranger', '/assets/Card 3/multibird.avif', 'song_arrangement', 1, 1),
  ('arrange_2', 'NEW JIEW - ยาพิษ (ซนซน 40 ปี GMM GRAMMY)', 'Co-Producer & Arranger', '/assets/Card 3/yapis.avif', 'song_arrangement', 2, 1),
  ('arrange_3', 'ROV Lauriel', 'Assitant Composer', '/assets/Card 3/RoV-Thai.avif', 'song_arrangement', 3, 1),
  ('arrange_4', 'เจ้าชายนิทรา - Fluke Natouch', 'Arranger', '/assets/Card 3/Sleeping Prince.avif', 'song_arrangement', 4, 1),
  ('arrange_5', 'กาลครั้งหนึ่ง - พลอยชมพู JANNINE WEIGEL (Ost.Postmanไปรษณีย์4โลก)', 'Re-arranger', '/assets/Card 3/once.avif', 'song_arrangement', 5, 1);

-- ============================================
-- 3. INSERT TRACKS (ข้อมูลเดิม + display_order)
-- ============================================
INSERT INTO Track (title, artist, src, project_id, display_order, duration) VALUES 
  /* score_1: Tee yod */
  ('Whispers in the Dark', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/teeyod/Thee%20Yod%20SAX%2001_comp/Thee%20Yod%20SAX%2001_comp.m3u8', 'score_1', 1, 0),
  ('A Glimmer of Hope', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/teeyod/Thee%20Yod%20SAX%2002_comp/Thee%20Yod%20SAX%2002_comp.m3u8', 'score_1', 2, 0),
  ('Heart to Heart', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/teeyod/Thee%20Yod%20SAX%2003_comp/Thee%20Yod%20SAX%2003_comp.m3u8', 'score_1', 3, 0),
  
  /* score_2: Bangkok breaking 2 */
  ('Gridlock Pulse', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/BK2/BSS_BKS_R1_comp/BSS_BKS_R1_comp.m3u8', 'score_2', 1, 0),
  ('Shadow Infiltration', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/BK2/BSS_BKS_R2_comp/BSS_BKS_R2_comp.m3u8', 'score_2', 2, 0),
  ('Confrontation Point', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/BK2/BSS_BKS_R3_comp/BSS_BKS_R3_comp.m3u8', 'score_2', 3, 0),
  ('Adrenaline Glitch', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/BK2/BSS_BKS_R4_comp/BSS_BKS_R4_comp.m3u8', 'score_2', 4, 0),
  ('Underbelly Lullaby', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/BK2/BSS_BKS_R5_comp/BSS_BKS_R5_comp.m3u8', 'score_2', 5, 0),
  ('Fading Sirens', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/BK2/BSS_BKS_R6_comp/BSS_BKS_R6_comp.m3u8', 'score_2', 6, 0),
  
  /* score_3: Spaceless */
  ('Unspoken Longing', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/SPL/SPL%201_comp/SPL%201_comp.m3u8', 'score_3', 1, 0),
  ('Stardust Memories', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/SPL/SPL%202_comp/SPL%202_comp.m3u8', 'score_3', 2, 0),
  ('Worlds Apart', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/SPL/SPL%203_comp/SPL%203_comp.m3u8', 'score_3', 3, 0),
  
  /* score_4: 14 Again */
  ('The Time Warp Begins', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/14%20again/14%20again%200_comp/14%20again%200_comp.m3u8', 'score_4', 1, 0),
  ('First Day Fumbles', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/14%20again/14%20again%201_comp/14%20again%201_comp.m3u8', 'score_4', 2, 0),
  ('Forever', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/14%20again/14%20again%202_comp/14%20again%202_comp.m3u8', 'score_4', 3, 0),
  ('Secret Admirer', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/14%20again/14%20again%203_comp/14%20again%203_comp.m3u8', 'score_4', 4, 0),
  ('Misunderstanding', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/14%20again/14%20again%204_comp/14%20again%204_comp.m3u8', 'score_4', 5, 0),
  ('Heartfelt Confessions', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/14%20again/14%20again%205_comp/14%20again%205_comp.m3u8', 'score_4', 6, 0),
  
  /* score_5: Love You to Debt */
  ('Softening Stance', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%201_comp/Cash%201_comp.m3u8', 'score_5', 1, 0),
  ('Debt Collector''s', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%202_comp/Cash%202_comp.m3u8', 'score_5', 2, 0),
  ('Opening Balance', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%203_comp/Cash%203_comp.m3u8', 'score_5', 3, 0),
  ('Risky Investment', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%205_comp/Cash%205_comp.m3u8', 'score_5', 4, 0),
  ('All In', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%206_comp/Cash%206_comp.m3u8', 'score_5', 5, 0),
  ('Paid in Full', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%208_comp/Cash%208_comp.m3u8', 'score_5', 6, 0),
  ('Consequences', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%209_comp/Cash%209_comp.m3u8', 'score_5', 7, 0),
  ('Happily Ever After', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Cash/Cash%2011_comp/Cash%2011_comp.m3u8', 'score_5', 8, 0),
  
  /* score_6: Postman */
  ('Delivering Hope', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Postman/Postman%201_comp/Postman%201_comp.m3u8', 'score_6', 1, 0),
  ('Reflections', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Postman/Postman%202_comp/Postman%202_comp.m3u8', 'score_6', 2, 0),
  ('Finale', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Postman/Postman%203_comp/Postman%203_comp.m3u8', 'score_6', 3, 0),
  
  /* score_7: The X-Treme Riders */
  ('The Montage', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/KlaFahn/KlaFahn%20Sax%20-%201_comp/KlaFahn%20Sax%20-%201_comp.m3u8', 'score_7', 1, 0),
  ('Victory Lap', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/KlaFahn/KlaFahn%20Sax%20-%202_comp/KlaFahn%20Sax%20-%202_comp.m3u8', 'score_7', 2, 0),
  
  /* score_8: Will You Marry Monk? */
  ('Chaotic Thoughts', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%201_comp/Monk%201_comp.m3u8', 'score_8', 1, 0),
  ('Alms Round Mishap', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%202_comp/Monk%202_comp.m3u8', 'score_8', 2, 0),
  ('Encounter', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%203_comp/Monk%203_comp.m3u8', 'score_8', 3, 0),
  ('Temptation Trail', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%204_comp/Monk%204_comp.m3u8', 'score_8', 4, 0),
  ('Meditation Interrupted', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%205_comp/Monk%205_comp.m3u8', 'score_8', 5, 0),
  ('Enlightenment?', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%206_comp/Monk%206_comp.m3u8', 'score_8', 6, 0),
  ('Intertwined', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%209_comp/Monk%209_comp.m3u8', 'score_8', 7, 0),
  ('Forbidden Feelings', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Monk/Monk%2010_comp/Monk%2010_comp.m3u8', 'score_8', 8, 0),
  
  /* score_9: The Djinns Curse */
  ('Khong Khaeg OST', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Khong%20Khaeg/Khong%20Khaeg%20ost_comp/Khong%20Khaeg%20ost_comp.m3u8', 'score_9', 1, 0),
  ('The Arrival', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Khong%20Khaeg/Khong%20Khaeg%201_comp/Khong%20Khaeg%201_comp.m3u8', 'score_9', 2, 0),
  ('Shadows', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Khong%20Khaeg/Khong%20Khaeg%202_comp/Khong%20Khaeg%202_comp.m3u8', 'score_9', 3, 0),
  ('Ritual', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Khong%20Khaeg/Khong%20Khaeg%203_comp/Khong%20Khaeg%203_comp.m3u8', 'score_9', 4, 0),
  ('Suspense', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Khong%20Khaeg/Khong%20Khaeg%204_comp/Khong%20Khaeg%204_comp.m3u8', 'score_9', 5, 0),
  
  /* score_10: The Cursed Land */
  ('Woods', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/The%20Curse%20Land/The%20Curse%20Land%201_comp/The%20Curse%20Land%201_comp.m3u8', 'score_10', 1, 0),
  ('Unseen Presence', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/The%20Curse%20Land/The%20Curse%20Land%202_comp/The%20Curse%20Land%202_comp.m3u8', 'score_10', 2, 0),
  ('Fear Escape', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/The%20Curse%20Land/The%20Curse%20Land%203_comp/The%20Curse%20Land%203_comp.m3u8', 'score_10', 3, 0),
  
  /* score_11: The Elite of Devils */
  ('Infiltration', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Hmom/Hmom%201_comp/Hmom%201_comp.m3u8', 'score_11', 1, 0),
  ('Ancient Power', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Hmom/Hmom%202_comp/Hmom%202_comp.m3u8', 'score_11', 2, 0),
  ('Jungle Chase', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%201/wav/Hmom/Hmom%203_comp/Hmom%203_comp.m3u8', 'score_11', 3, 0),
  
  /* series_1: Don't come home */
  ('The Clock Ticks', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Don''t%20Come%20Home/time%201_comp/time%201_comp.m3u8', 'series_1', 1, 0),
  ('Eerie Silence', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Don''t%20Come%20Home/time%202_comp/time%202_comp.m3u8', 'series_1', 2, 0),
  ('Resolution', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Don''t%20Come%20Home/time%203_comp/time%203_comp.m3u8', 'series_1', 3, 0),
  
  /* series_2: I saw you in my dream */
  ('Waking Echoes (Main Theme)', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/SUD/SUD%201_comp/SUD%201_comp.m3u8', 'series_2', 1, 0),
  ('Dream Sequence', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/SUD/SUD%202_comp/SUD%202_comp.m3u8', 'series_2', 2, 0),
  ('Lingering Thoughts', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/SUD/SUD%203_comp/SUD%203_comp.m3u8', 'series_2', 3, 0),
  ('Familiar Stranger', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/SUD/SUD%204_comp/SUD%204_comp.m3u8', 'series_2', 4, 0),
  ('Until We Dream Again', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/SUD/SUD%205_comp/SUD%205_comp.m3u8', 'series_2', 5, 0),
  
  /* series_3: Summer Night */
  ('Hazy Silhouettes (Main Theme)', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Summer%20Night/Summer%20Night%20Theme_comp/Summer%20Night%20Theme_comp.m3u8', 'series_3', 1, 0),
  ('Under the Stars', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Summer%20Night/Summer%20Night%201_comp/Summer%20Night%201_comp.m3u8', 'series_3', 2, 0),
  ('Heartbreak', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Summer%20Night/Summer%20Night%202_comp/Summer%20Night%202_comp.m3u8', 'series_3', 3, 0),
  
  /* series_4: Step by Step */
  ('First Glance', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Step/step%2001%20master_comp/step%2001%20master_comp.m3u8', 'series_4', 1, 0),
  ('Daydreams', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Step/step%2002%20master_comp/step%2002%20master_comp.m3u8', 'series_4', 2, 0),
  ('Hesitant Hearts', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Step/step%2003%20master_comp/step%2003%20master_comp.m3u8', 'series_4', 3, 0),
  ('Our Own Pace', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Step/step%2004%20master_comp/step%2004%20master_comp.m3u8', 'series_4', 4, 0),
  
  /* series_5: Every You Every Me */
  ('Destiny', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/EVU/EVU%20Theme_comp/EVU%20Theme_comp.m3u8', 'series_5', 1, 0),
  
  /* series_6: Bussing Thailand */
  ('เฟี้ยว (variation 1)', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Bussing/Bussing%201_comp/Bussing%201_comp.m3u8', 'series_6', 1, 0),
  ('เฟี้ยว (variation 2)', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Bussing/Bussing%202_comp/Bussing%202_comp.m3u8', 'series_6', 2, 0),
  ('เฟี้ยว (variation 3)', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Bussing/Bussing%203_comp/Bussing%203_comp.m3u8', 'series_6', 3, 0),
  ('เฟี้ยว (variation 4)', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Bussing/Bussing%204_comp/Bussing%204_comp.m3u8', 'series_6', 4, 0),
  
  /* series_7: Jaipusut */
  ('Pure Heart', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/Jai%20Pisoot/JPS_comp/JPS_comp.m3u8', 'series_7', 1, 0),
  
  /* series_8: Terror Tuesday : Extreme */
  ('The Veil Thins', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/AKKP/AKKP%201_comp/AKKP%201_comp.m3u8', 'series_8', 1, 0),
  ('Shadows in the Corner', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/AKKP/AKKP%202_comp/AKKP%202_comp.m3u8', 'series_8', 2, 0),
  ('Is Anybody There?', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/AKKP/AKKP%203_comp/AKKP%203_comp.m3u8', 'series_8', 3, 0),
  ('Forever Haunted', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/AKKP/AKKP%204_comp/AKKP%204_comp.m3u8', 'series_8', 4, 0),
  ('Twisted Truth', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/AKKP/AKKP%205_comp/AKKP%205_comp.m3u8', 'series_8', 5, 0),
  
  /* series_9: Dear my secretary */
  ('จังหวะตกหลุมรัก (Main Theme)', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/dear%20my%20secretary/DMS%20Song%2001_comp/DMS%20Song%2001_comp.m3u8', 'series_9', 1, 0),
  ('Funny Cue', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/dear%20my%20secretary/DMS%20Song%2002_comp/DMS%20Song%2002_comp.m3u8', 'series_9', 2, 0),
  ('Tender Moment', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%202/wav/dear%20my%20secretary/DMS%20Song%2003_comp/DMS%20Song%2003_comp.m3u8', 'series_9', 3, 0),
  
  /* arrange_2: NEW JIEW - ยาพิษ (ซนซน 40 ปี GMM GRAMMY) */
  ('ยาพิษ - NEW JIEW', 'Terdsak Janpan & Panuwat Sarapat', 'https://hls.saxmusic.site/Card%203/wav/yapis/NEW%20JIEW%20-%20Yapis%20%20%2040%20%20GMM_comp/NEW%20JIEW%20-%20Yapis%20%20%2040%20%20GMM_comp.m3u8', 'arrange_2', 1, 0),
  
  /* arrange_3: ROV Lauriel */
  ('Lunar Eclipse', 'Panuwat Sarapat', 'https://hls.saxmusic.site/Card%203/wav/ROV/ROV%20Lauriel_comp/ROV%20Lauriel_comp.m3u8', 'arrange_3', 1, 0),
  
  /* arrange_4: เจ้าชายนิทรา - Fluke Natouch */
  ('เจ้าชายนิทรา', 'Fluke Natouch', 'https://hls.saxmusic.site/Card%203/wav/Sleeping%20Prince/Sleeping%20Prince_comp/Sleeping%20Prince_comp.m3u8', 'arrange_4', 1, 0),
  
  /* arrange_5: กาลครั้งหนึ่ง - พลอยชมพู JANNINE WEIGEL (Ost.Postmanไปรษณีย์4โลก) */
  ('กาลครั้งหนึ่ง', 'JANNINE WEIGEL', 'https://hls.saxmusic.site/Card%203/wav/once/once_comp/once_comp.m3u8', 'arrange_5', 1, 0);