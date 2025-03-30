
# ChatChain Haven

A WhatsApp-like messaging application with blockchain message storage. Built with React, TypeScript, and Tailwind CSS.

## Features

- 💬 Real-time messaging with blockchain storage simulation
- 👤 User authentication with username/password
- 👥 Contact management
- 👪 Group chat support
- 🔐 Profile customization
- 📱 Responsive design for mobile and desktop

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **State Management**: Context API
- **Routing**: React Router
- **Data Fetching**: TanStack Query
- **Blockchain Simulation**: Local storage with transaction hashes

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/chatchain-haven.git
cd chatchain-haven
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to `http://localhost:8080`

## Demo Users

- Username: `demo`, Password: `password`
- Or register a new account

## Project Structure

```
src/
├── components/       # UI components
│   ├── Auth/         # Authentication components
│   ├── Chat/         # Chat interface components
│   ├── Layout/       # Layout components
│   └── ui/           # Reusable UI components
├── context/          # React contexts
│   ├── AuthContext   # Authentication state
│   └── ChatContext   # Chat functionality and state
├── hooks/            # Custom React hooks
├── pages/            # Application pages/routes
├── services/         # Service modules
│   └── blockchainService.ts # Blockchain simulation
└── lib/              # Utility functions
```

## Deployment

See [deploy.md](deploy.md) for detailed deployment instructions.

## Future Enhancements

- Integration with a real blockchain network (Ethereum, Solana, etc.)
- End-to-end encryption
- File sharing capabilities
- Read receipts and typing indicators
- Push notifications
- Voice messages

## License

This project is MIT licensed.
