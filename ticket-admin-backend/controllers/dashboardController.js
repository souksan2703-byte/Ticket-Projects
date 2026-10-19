const { sql, getPool } = require("../config/db");

const SOLD_DATE_SQL = "COALESCE(tc.soldAt, tc.created)";

function buildDateFilter(request, from, to, dateExpr = SOLD_DATE_SQL) {
  let where = "";
  if (from) {
    request.input("from", sql.Date, from);
    where += ` AND ${dateExpr} >= @from`;
  }
  if (to) {
    request.input("to", sql.Date, to);
    where += ` AND ${dateExpr} < DATEADD(day, 1, @to)`;
  }
  return where;
}

// GET /api/dashboard/summary
// ກາດສະຫຼຸບ 4 ອັນ: Today's sales, Tickets sold this month, Active, OFF
// (ຄ່ານີ້ຕຶງກັບ "ມື້ນີ້"/"ເດືອນນີ້" ແທ້ໆສະເໝີ ບໍ່ຜູກກັບຕົວກອງວັນທີ່ເທິງໜ້າ Dashboard)
async function getSummary(req, res) {
  try {
    const pool = await getPool();

    const salesResult = await pool.request().query(`
            SELECT ISNULL(SUM(m.Price), 0) AS todaysSales
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0
                AND CAST(${SOLD_DATE_SQL} AS date) = CAST(GETDATE() AS date)
        `);

    const monthResult = await pool.request().query(`
            SELECT COUNT(*) AS ticketsSoldThisMonth
            FROM TicketCode tc
            WHERE tc.status = 0
                AND YEAR(${SOLD_DATE_SQL}) = YEAR(GETDATE())
                AND MONTH(${SOLD_DATE_SQL}) = MONTH(GETDATE())
        `);

    const statusResult = await pool.request().query(`
            SELECT
                SUM(CASE WHEN RTRIM(Status) = 'Open' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN RTRIM(Status) = 'OFF' THEN 1 ELSE 0 END) AS offCount
            FROM TicketCodeMaster
        `);

    res.json({
      todaysSales: salesResult.recordset[0].todaysSales || 0,
      ticketsSoldThisMonth: monthResult.recordset[0].ticketsSoldThisMonth || 0,
      active: statusResult.recordset[0].active || 0,
      off: statusResult.recordset[0].offCount || 0,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "ດຶງຂໍ້ມູນສະຫຼຸບບໍ່ສຳເລັດ", error: err.message });
  }
}

// GET /api/dashboard/sold-by-event?from=&to= -> ຈຳນວນຕົ໋ວທີ່ຂາຍໄດ້ ແຍກຕາມອີເວັນ (ສຳລັບແຖບສີດ້ານເທິງ)
async function getSoldByEvent(req, res) {
  try {
    const { from, to } = req.query;
    const pool = await getPool();
    const request = pool.request();

    // ກຳນົດເງື່ອນໄຂສຳລັບ TicketCode
    const joinConditions = ["tc.tickid = m.tickid", "tc.status = 0"];

    if (from) {
      request.input("from", sql.Date, from);
      joinConditions.push(`${SOLD_DATE_SQL} >= @from`);
    }

    if (to) {
      request.input("to", sql.Date, to);
      joinConditions.push(`${SOLD_DATE_SQL} < DATEADD(day, 1, @to)`);
    }

    const result = await request.query(`
      SELECT
        m.tickid,
        m.Title AS name,
        COUNT(tc.tickid) AS value
      FROM TicketCodeMaster m
      LEFT JOIN TicketCode tc
        ON ${joinConditions.join(" AND ")}
      GROUP BY m.tickid, m.Title
      ORDER BY COUNT(tc.tickid) DESC, m.tickid ASC
    `);

    res.json(
      result.recordset.map((row) => ({
        tickid: row.tickid,
        name: row.name,
        value: Number(row.value),
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "ດຶງຂໍ້ມູນບໍ່ສຳເລັດ",
      error: err.message,
    });
  }
}

// GET /api/dashboard/ticket-mix?from=&to= -> ເອົາແຕ່ 2 ອີເວັນທີ່ຂາຍດີທີ່ສຸດ ມາຄິດເປັນ % ທຽບກັນເອງ (ສຳລັບ pie chart)
// GET /api/dashboard/ticket-mix?from=&to=
async function getTicketMix(req, res) {
  try {
    const { from, to } = req.query;
    const pool = await getPool();
    const request = pool.request();

    // ກຳນົດສີໃຫ້ແຕ່ລະ Event
    const colors = [
      "#F97316",
      "#2563EB",
      "#16A34A",
      "#DC2626",
      "#9333EA",
      "#0891B2",
      "#FACC15",
      "#F43F5E",
      "#8B5CF6",
      "#14B8A6",
    ];

    // ກຳນົດເງື່ອນໄຂວັນທີໃນ JOIN
    // ເພື່ອໃຫ້ Event ທີ່ຍັງບໍ່ມີການຂາຍກໍສະແດງ
    const joinConditions = ["tc.status = 0"];

    if (from) {
      request.input("from", sql.Date, from);
      joinConditions.push(`${SOLD_DATE_SQL} >= @from`);
    }

    if (to) {
      request.input("to", sql.Date, to);
      joinConditions.push(`${SOLD_DATE_SQL} < DATEADD(day, 1, @to)`);
    }

    const result = await request.query(`
      SELECT
        m.tickid,
        m.Title AS name,
        COUNT(tc.tickid) AS count
      FROM TicketCodeMaster m
      LEFT JOIN TicketCode tc
        ON tc.tickid = m.tickid
        AND ${joinConditions.join(" AND ")}
      GROUP BY m.tickid, m.Title
      ORDER BY m.tickid
    `);

    const rows = result.recordset;
    const total = rows.reduce((sum, row) => sum + Number(row.count), 0);

    res.json(
      rows.map((row, index) => ({
        name: row.name,
        count: Number(row.count),
        value: total > 0 ? Math.round((Number(row.count) / total) * 100) : 0,
        color: colors[index % colors.length],
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "ດຶງຂໍ້ມູນບໍ່ສຳເລັດ",
      error: err.message,
    });
  }
}

// GET /api/dashboard/transactions?from=&to= -> ລາຍຮັບລາຍວັນຂອງ 2 ອີເວັນທີ່ຂາຍດີທີ່ສຸດ (ສຳລັບ line chart)
// ຖ້າບໍ່ລະບຸໄລຍະວັນທີ່ ຈະໃຊ້ "ເດືອນນີ້" (ວັນທີ 1 ເຖິງວັນສຸດທ້າຍຂອງເດືອນ) ເປັນຄ່າເລີ່ມຕົ້ນ
// GET /api/dashboard/transactions?from=&to=
// ສະແດງລາຍຮັບລາຍວັນຂອງທຸກ Event
async function getTransactionSeries(req, res) {
  try {
    let { from, to } = req.query;
    const pool = await getPool();

    // ຖ້າບໍ່ລະບຸວັນທີ ໃຊ້ເດືອນປັດຈຸບັນ
    if (!from || !to) {
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );

      const formatDate = (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(date.getDate()).padStart(2, "0")}`;

      from = from || formatDate(firstOfMonth);
      to = to || formatDate(lastOfMonth);
    }

    // ດຶງ Event ທຸກອັນ ບໍ່ຈຳກັດ TOP 2
    const eventsResult = await pool.request().query(`
      SELECT tickid, Title AS name
      FROM TicketCodeMaster
      ORDER BY tickid
    `);

    const events = eventsResult.recordset.map((row) => row.name);

    if (eventsResult.recordset.length === 0) {
      return res.json({ events: [], series: [] });
    }

    // ດຶງລາຍຮັບຈາກການຂາຍຕາມວັນ ແລະ Event
    const dataResult = await pool
      .request()
      .input("from", sql.Date, from)
      .input("to", sql.Date, to).query(`
        SELECT
          CONVERT(
            varchar(10),
            ${SOLD_DATE_SQL},
            23
          ) AS date,
          m.Title AS eventName,
          SUM(m.Price) AS revenue
        FROM TicketCode tc
        JOIN TicketCodeMaster m
          ON m.tickid = tc.tickid
        WHERE tc.status = 0
          AND ${SOLD_DATE_SQL} >= @from
          AND ${SOLD_DATE_SQL} < DATEADD(day, 1, @to)
        GROUP BY
          CONVERT(
            varchar(10),
            ${SOLD_DATE_SQL},
            23
          ),
          m.Title
      `);

    const byDate = {};

    dataResult.recordset.forEach((row) => {
      if (!byDate[row.date]) {
        byDate[row.date] = {};
      }

      byDate[row.date][row.eventName] = Number(row.revenue) || 0;
    });

    // ສ້າງຂໍ້ມູນຄົບທຸກວັນ ແລະທຸກ Event
    const series = [];
    const cursor = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T00:00:00`);

    while (cursor <= endDate) {
      const dateKey = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0"),
      ].join("-");

      const entry = { date: dateKey };

      events.forEach((name) => {
        entry[name] = byDate[dateKey]?.[name] ?? 0;
      });

      series.push(entry);
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({ events, series });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "ດຶງຂໍ້ມູນບໍ່ສຳເລັດ",
      error: err.message,
    });
  }
}

module.exports = {
  getSummary,
  getSoldByEvent,
  getTicketMix,
  getTransactionSeries,
};
