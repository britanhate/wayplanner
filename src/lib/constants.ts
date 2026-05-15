import type { UserProfile } from "../shared/types/domain";

export const USERS: UserProfile[] = [
  {
    id: "user1",
    name: "Марія",
    email: "utkinam@wayplanner.app",
    password: "maria2024",
    color: "#e8622a",
    avatar: "🦸🏻‍♀️",
  },
  {
    id: "user2",
    name: "Богдан",
    email: "pishcholinb@wayplanner.app",
    password: "bohdan2024",
    color: "#2abf6e",
    avatar: "🦸🏼",
  },
  {
    id: "user3",
    name: "Нікіта",
    email: "kuschn@wayplanner.app",
    password: "nikita2024",
    color: "#2a7de8",
    avatar: "🦸🏽‍♂️",
  },
];

export const POINT_TYPES = {
  hotel: { label: "Готель", emoji: "🏨", color: "#2a7de8" },
  sight: { label: "Пам'ятка", emoji: "📍", color: "#e8ac2a" },
  food: { label: "Ресторан", emoji: "🍽", color: "#2abf6e" },
  airport: { label: "Аеропорт", emoji: "✈️", color: "#2adbe8" },
  photo: { label: "Фото-зона", emoji: "📸", color: "#e82a93" },
  museum: { label: "Музей", emoji: "🏛️", color: "#e82a2a" },
  bus: { label: "Автобус", emoji: "🚌", color: "#dbe82a" },
  shop: { label: "Шопінг", emoji: "💸", color: "#2ae853" },
  bts: { label: "Чонгук", emoji: "👨‍🌾", color: "#e82a63" },
} as const;

export const EXPENSE_CATEGORIES = [
  { value: "Житло", emoji: "🏨", color: "#2a7de8" },
  { value: "Їжа", emoji: "🍽", color: "#2abf6e" },
  { value: "Транспорт", emoji: "🚌", color: "#e8622a" },
  { value: "Розваги", emoji: "🎭", color: "#9b59b6" },
  { value: "Шопінг", emoji: "🛍", color: "#e8a82a" },
  { value: "Інше", emoji: "📦", color: "#8888aa" },
] as const;

export const CURRENCIES = ["UAH", "EUR", "USD", "PLN"] as const;

export const EXCHANGE_RATES = {
  EUR: 1,
  USD: 0.92,
  UAH: 0.025,
  PLN: 0.24,
} as const;
