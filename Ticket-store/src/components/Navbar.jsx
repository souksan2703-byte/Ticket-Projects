import { Link } from "react-router-dom";
import { Ticket, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { totalQuantity } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
          <Ticket className="h-6 w-6 text-red-600" />
          Ticket Store
        </Link>
        <Link
          to="/cart"
          className="relative flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          <ShoppingCart className="h-4 w-4" />
          ตะกร้า
          {totalQuantity > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
              {totalQuantity}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
