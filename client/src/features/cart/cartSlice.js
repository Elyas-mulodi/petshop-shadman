import { createSlice } from "@reduxjs/toolkit";

// ---------- خواندن سبد مهمان از localStorage موقع بارگذاری اولیه ----------
const loadGuestCart = () => {
  try {
    const data = localStorage.getItem("guestCart");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = (items) => {
  localStorage.setItem("guestCart", JSON.stringify(items));
};

const initialState = {
  // برای مهمان: آرایه‌ی ساده { productId, variantId, quantity } که توی localStorage هم می‌مونه
  guestItems: loadGuestCart(),
  // برای کاربر لاگین‌کرده: نتیجه کامل از سرور (با قیمت لحظه‌ای، تخفیف و ...)
  serverCart: null,
  isLoading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToGuestCart: (state, action) => {
      const { productId, variantId, quantity } = action.payload;
      const existing = state.guestItems.find((i) => i.variantId === variantId);

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, 10);
      } else {
        state.guestItems.push({ productId, variantId, quantity });
      }

      saveGuestCart(state.guestItems);
    },
    updateGuestCartItem: (state, action) => {
      const { variantId, quantity } = action.payload;
      const item = state.guestItems.find((i) => i.variantId === variantId);
      if (item) item.quantity = quantity;
      saveGuestCart(state.guestItems);
    },
    removeGuestCartItem: (state, action) => {
      state.guestItems = state.guestItems.filter(
        (i) => i.variantId !== action.payload,
      );
      saveGuestCart(state.guestItems);
    },
    clearGuestCart: (state) => {
      state.guestItems = [];
      localStorage.removeItem("guestCart");
    },
    replaceGuestCart: (state, action) => {
      state.guestItems = action.payload;
      saveGuestCart(state.guestItems);
    },
    setServerCart: (state, action) => {
      state.serverCart = action.payload;
    },
    setCartLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  addToGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  setServerCart,
  setCartLoading,
  replaceGuestCart
} = cartSlice.actions;

export default cartSlice.reducer;
