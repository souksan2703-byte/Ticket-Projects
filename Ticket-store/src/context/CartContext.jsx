import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "ticket-store-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(event, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.tickid === event.tickid);
      if (existing) {
        return prev.map((i) =>
          i.tickid === event.tickid ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          tickid: event.tickid,
          name: event.Title,
          price: event.Price,
          location: event.Location,
          dateEvent: event.DateEvent,
          maxStock: event.Stock,
          quantity,
        },
      ];
    });
  }

  function updateQuantity(tickid, quantity) {
    setItems((prev) =>
      prev
        .map((i) => (i.tickid === tickid ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(tickid) {
    setItems((prev) => prev.filter((i) => i.tickid !== tickid));
  }

  function clearCart() {
    setItems([]);
  }

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clearCart, totalQuantity, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart ต้องถูกใช้ภายใน <CartProvider>");
  return ctx;
}
