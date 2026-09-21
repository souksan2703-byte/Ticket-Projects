import { useState, useEffect } from "react"; // 1. เพิ่ม useEffect ตรงนี้
import { login } from "../api.js";

export default function LoginPage({ onSignIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. เคลียร์ Session เก่าทิ้งทันทีที่เปิดเข้าหน้านี้ ป้องกันการ Redirect วนกลับ
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username, password);
      onSignIn(user);
    } catch (err) {
      setError(err.message || "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-10 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-neutral-900">ລະບົບຈັດການປີ້</h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          ເຂົ້າສູ່ລະບົບເພື່ອຈັດການງານອີເວັນຕ໌ ແລະ ປີ້
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm text-neutral-700">ຊື່ຜູ້ໃຊ້</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              placeholder="ປ້ອນຊື່ຜູ້ໃຊ້"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-neutral-700">ລະຫັດຜ່ານ</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              placeholder="ປ້ອນລະຫັດຜ່ານ"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "ກຳລັງເຂົ້າສູ່ລະບົບ..." : "ເຂົ້າສູ່ລະບົບ"}
          </button>
        </form>
      </div>
    </div>
  );
}