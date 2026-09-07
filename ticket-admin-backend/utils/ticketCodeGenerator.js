const { sql } = require('../config/db');

// สุ่มโค้ดตั๋ว เช่น "TESTC-8F2K91" จาก prefix ที่กำหนด
function randomCode(prefix) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ตัดตัวที่สับสนง่ายออก (0,O,1,I)
    let suffix = '';
    for (let i = 0; i < 6; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${suffix}`;
}

// สร้าง prefix อัตโนมัติจากชื่ออีเวนต์ เช่น "Test Concert" -> "TESTCO"
function prefixFromTitle(title) {
    const alnum = (title || 'TIX').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return alnum.slice(0, 6) || 'TIX';
}

// สร้างโค้ดตั๋วเป็นชุด (bulk) ผูกกับ tickid ที่กำหนด
// การ insert แต่ละแถวจะไปสั่ง trigger InsertTicketStock ให้ Stock ใน TicketCodeMaster +1 ให้อัตโนมัติ
// คืนค่าเป็น array ของโค้ดที่สร้างสำเร็จ
async function generateCodesForEvent(pool, tickid, quantity, prefix) {
    const createdCodes = [];
    const safePrefix = prefix || 'TIX';

    for (let i = 0; i < quantity; i++) {
        let inserted = false;
        let attempts = 0;

        // ลองใหม่กรณีสุ่มโค้ดชนกับที่มีอยู่แล้ว (unique constraint)
        while (!inserted && attempts < 5) {
            attempts++;
            const code = randomCode(safePrefix);
            try {
                await pool.request()
                    .input('tickid', sql.Int, tickid)
                    .input('code', sql.NVarChar(50), code)
                    .query(`
                        INSERT INTO TicketCode (tickid, code)
                        VALUES (@tickid, @code)
                    `);
                createdCodes.push(code);
                inserted = true;
            } catch (err) {
                if (!err.message.includes('IX_TicketCode')) throw err; // error อื่นที่ไม่ใช่โค้ดชนกัน ให้โยนต่อ
                // ถ้าชนกัน วน loop สุ่มใหม่
            }
        }
    }

    return createdCodes;
}

module.exports = { randomCode, prefixFromTitle, generateCodesForEvent };
