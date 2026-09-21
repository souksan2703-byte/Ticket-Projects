const { sql } = require('../config/db');

// ສຸ່ມລະຫັດຕົ໋ວ ເຊັ່ນ "TESTC-8F2K91" ຈາກ prefix ທີ່ກຳນົດ
function randomCode(prefix) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ຕັດໂຕທີ່ສັບສົນງ່າຍອອກ (0,O,1,I)
    let suffix = '';
    for (let i = 0; i < 6; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${suffix}`;
}

// ສ້າງ prefix ອັດຕະໂນມັດຈາກຊື່ອີເວັນ ເຊັ່ນ "Test Concert" -> "TESTCO"
function prefixFromTitle(title) {
    const alnum = (title || 'TIX').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return alnum.slice(0, 6) || 'TIX';
}

// ສ້າງລະຫັດຕົ໋ວເປັນຊຸດ (bulk) ຜູກກັບ tickid ທີ່ກຳນົດ
// ການ insert ແຕ່ລະແຖວຈະໄປສັ່ງ trigger InsertTicketStock ໃຫ້ Stock ໃນ TicketCodeMaster +1 ໃຫ້ອັດຕະໂນມັດ
// ສົ່ງຄືນຄ່າເປັນ array ຂອງລະຫັດທີ່ສ້າງສຳເລັດ
async function generateCodesForEvent(pool, tickid, quantity, prefix) {
    const createdCodes = [];
    const safePrefix = prefix || 'TIX';

    for (let i = 0; i < quantity; i++) {
        let inserted = false;
        let attempts = 0;

        // ລອງໃໝ່ກໍລະນີສຸ່ມລະຫັດຊົນກັບທີ່ມີຢູ່ແລ້ວ (unique constraint)
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
                if (!err.message.includes('IX_TicketCode')) throw err; // error ອື່ນທີ່ບໍ່ແມ່ນລະຫັດຊົນກັນ ໃຫ້ໂຍນຕໍ່
                // ຖ້າຊົນກັນ ວົນ loop ສຸ່ມໃໝ່
            }
        }
    }

    return createdCodes;
}

module.exports = { randomCode, prefixFromTitle, generateCodesForEvent };
