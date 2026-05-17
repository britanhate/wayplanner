import type { UserProfile } from "../shared/types/domain";

export const USERS: UserProfile[] = [
  {
    id: "user1",
    name: "Марія",
    email: "utkinam@wayplanner.app",
    color: "#e8622a",
    avatar: "user",
  },
  {
    id: "user2",
    name: "Богдан",
    email: "pishcholinb@wayplanner.app",
    color: "#2abf6e",
    avatar: "user",
  },
  {
    id: "user3",
    name: "Нікіта",
    email: "kuschn@wayplanner.app",
    color: "#2a7de8",
    avatar: "user",
  },
];

export const POINT_TYPES = {
  hotel: { label: "Готель", icon: "home", color: "#2a7de8" },
  sight: { label: "Пам'ятка", icon: "pin", color: "#e8ac2a" },
  food: { label: "Ресторан", icon: "restaurant", color: "#2abf6e" },
  airport: { label: "Аеропорт", icon: "launch", color: "#2adbe8" },
  photo: { label: "Фото-зона", icon: "camera", color: "#e82a93" },
  museum: { label: "Музей", icon: "organization", color: "#e82a2a" },
  bus: { label: "Автобус", icon: "bus", color: "#dbe82a" },
  shop: { label: "Шопінг", icon: "shopping-cart", color: "#2ae853" },
  bts: { label: "Чонгук", icon: "user", color: "#e82a63" },
} as const;

export const EXPENSE_CATEGORIES = [
  { value: "Житло", icon: "home", color: "#2a7de8" },
  { value: "Їжа", icon: "restaurant", color: "#2abf6e" },
  { value: "Транспорт", icon: "bus", color: "#e8622a" },
  { value: "Розваги", icon: "theater", color: "#9b59b6" },
  { value: "Шопінг", icon: "shopping-cart", color: "#e8a82a" },
  { value: "Інше", icon: "cube", color: "#8888aa" },
] as const;

export const CURRENCIES = ["UAH", "EUR", "USD", "PLN"] as const;

export const EXCHANGE_RATES = {
  EUR: 1,
  USD: 0.92,
  UAH: 0.025,
  PLN: 0.24,
} as const;
