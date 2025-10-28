# Frontend Structure

This document outlines the organized structure for the Swaggo Frontend application.

## Directory Structure

```
src/
├── components/              # React components organized by feature
│   ├── Chat/               # All chat-related components
│   │   ├── Messaging/      # Message display and input components
│   │   ├── UI/             # Chat UI elements
│   │   ├── Media/          # Media handling components
│   │   ├── Features/       # Special chat features
│   │   ├── Polls/          # Poll components
│   │   ├── Templates/      # Message templates
│   │   ├── Search/         # Chat search components
│   │   ├── Settings/       # Chat settings UI
│   │   ├── Tests/          # Chat component tests
│   │   └── Voice/          # Voice chat components
│   ├── UI/                 # Generic UI components
│   ├── Layout/             # Layout components
│   ├── Auth/               # Authentication components
│   ├── Common/             # Shared/common components
│   ├── Features/           # Feature-specific components
│   ├── Settings/           # Settings components
│   ├── Admin/              # Admin panel components
│   ├── Debug/              # Debug components
│   ├── AIBot/              # AI Bot components
│   ├── Accessibility/      # Accessibility components
│   ├── DataScience/        # Data science components
│   ├── ErrorBoundary/      # Error boundary components
│   ├── Examples/           # Example components
│   ├── Helper/             # Helper components
│   ├── Performance/        # Performance monitoring components
│   ├── SEO/                # SEO components
│   ├── Search/             # Search components
│   ├── VIP/                # VIP features components
│   ├── hoc/                # Higher-order components
│   └── shared/             # Shared components
├── services/               # Business logic and API services
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
├── lib/                    # Library code and third-party integrations
├── store/                  # State management (Zustand stores)
├── assets/                 # Static assets (images, fonts, etc.)
├── config/                 # Configuration files
├── types/                  # TypeScript type definitions
├── styles/                 # Global styles and theme files
└── tests/                  # Test utilities and setup files
```

## Migration Plan

1. Components from the root `Components/` directory will be moved to `src/components/`
2. Services from the root `services/` directory will be moved to `src/services/`
3. Hooks from the root `hooks/` directory will be moved to `src/hooks/`
4. Utilities from the root `utils/` directory will be moved to `src/utils/`
5. Library code from the root `lib/` directory will be moved to `src/lib/`

This structure provides better organization and follows modern React application conventions.