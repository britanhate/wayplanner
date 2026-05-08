// Фіксовані користувачі (логін / пароль / колір)
export const USERS = [
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
  sight: { label: "Пам'ятка", emoji: "📍", color: "#e8622a" },
  food: { label: "Ресторан", emoji: "🍽", color: "#2abf6e" },
  airport: {label: 'Аеропорт', emoji: '', color: '#e8b52a'}
};

export const EXPENSE_CATEGORIES = [
  { value: "Житло", emoji: "🏨", color: "#2a7de8" },
  { value: "Їжа", emoji: "🍽", color: "#2abf6e" },
  { value: "Транспорт", emoji: "🚌", color: "#e8622a" },
  { value: "Розваги", emoji: "🎭", color: "#9b59b6" },
  { value: "Шопінг", emoji: "🛍", color: "#e8a82a" },
  { value: "Інше", emoji: "📦", color: "#8888aa" },
];

export const CURRENCIES = ["UAH", "EUR", "USD", "PLN"];
