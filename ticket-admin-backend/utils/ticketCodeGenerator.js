
const { sql } = require("../config/db");

function randomCode(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${prefix}-${suffix}`;
}

function prefixFromTitle(title) {
  const alnum = (title || "TIX")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return alnum.slice(0, 6) || "TIX";
}

async function generateCodesForEvent(pool, tickid, quantity, prefix) {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error("ຈຳນວນລະຫັດບໍ່ຖືກຕ້ອງ");
  }

  const safePrefix = prefix || "TIX";
  const createdCodes = [];
  const batchSize = 100;

  for (let start = 0; start < quantity; start += batchSize) {
    const currentBatch = Math.min(batchSize, quantity - start);

    for (let i = 0; i < currentBatch; i++) {
      let inserted = false;
      let attempts = 0;

      while (!inserted && attempts < 5) {
        attempts++;

        const code = randomCode(safePrefix);

        try {
          await pool
            .request()
            .input("tickid", sql.Int, tickid)
            .input("code", sql.NVarChar(50), code)
            .query(`
              INSERT INTO TicketCode (tickid, code)
              VALUES (@tickid, @code)
            `);

          createdCodes.push(code);
          inserted = true;
        } catch (err) {
          // ສຸ່ມລະຫັດໃໝ່ຖ້າລະຫັດຊ້ຳ
          if (
            !err.message.includes("IX_TicketCode") &&
            !err.message.toLowerCase().includes("duplicate")
          ) {
            throw err;
          }
        }
      }

      if (!inserted) {
        throw new Error(
          `ບໍ່ສາມາດສ້າງລະຫັດໃໝ່ໄດ້ຫຼັງຈາກລອງ 5 ຄັ້ງ: ${start + i + 1}`
        );
      }
    }
  }

  return createdCodes;
}

module.exports = {
  randomCode,
  prefixFromTitle,
  generateCodesForEvent,
};
