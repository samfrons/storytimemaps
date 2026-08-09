# StoryMaps - Historical Jewish Businesses in Berlin (1900-1945)

## Overview
An interactive visualization platform documenting Jewish-owned businesses in Berlin from 1900 to 1945. This application combines historical data with modern web technologies to preserve memory and provide educational insights into this significant period of history.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)
![Mapbox](https://img.shields.io/badge/Mapbox-GL_3.14-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

### 🗺️ Interactive Map
- Clustered markers for efficient visualization of hundreds of businesses
- Dynamic marker states based on timeline (active, declining, closed)
- Custom styling inspired by Snazzy Maps
- Smooth animations and transitions

### 📅 Time-Based Filtering
- Interactive timeline slider (1920-1945)
- Real-time updates showing business states through history
- Play/pause animation to watch changes over time

### 📋 Business Directory
- Searchable and filterable business listings
- Categories: Businesses, Institutions, Residences
- Detailed information cards with historical context
- Synchronized selection between map and list

### 🖼️ Rich Media Support
- Historical photographs and documents
- Expandable detail views with full descriptions
- Modal system with smooth animations

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm package manager
- Mapbox account for API token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/storymaps.git
cd storymaps
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Mapbox token to `.env.local`:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
storymaps/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── components/   # React components
│   │   ├── globals.css   # Global styles
│   │   └── page.tsx      # Main page
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── types.ts          # TypeScript definitions
├── data/                 # Historical data files
├── public/               # Static assets
│   └── images/          # Historical photographs
└── IMPLEMENTATION_NOTES.md  # Technical documentation
```

## Technology Stack

### Frontend
- **Next.js 15.4.6** - React framework with SSR/SSG
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

### Mapping
- **Mapbox GL JS** - Interactive maps
- **React Map GL** - React wrapper for Mapbox
- **Supercluster** - Marker clustering

### Performance
- Dynamic imports for code splitting
- React.memo for component optimization
- Throttled/debounced event handlers
- Image optimization with Next.js Image

## Data Sources

The historical data comes from various archives and research projects documenting Jewish businesses in Berlin. Each entry includes:
- Business name and type
- Location (address and coordinates)
- Operating dates
- Historical context and descriptions
- Archival photographs when available

## Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript compiler check
```

### Code Style Guidelines

- Components use functional React with hooks
- All components wrapped in React.memo when receiving props
- TypeScript strict mode enabled
- No border-radius (sharp edges design choice)
- Consistent color palette (see CLAUDE.md)

### Performance Guidelines

See `PERFORMANCE_RULES.md` for detailed performance optimization guidelines.

## Deployment

### Vercel (Recommended)
The easiest deployment method is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/storymaps)

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. The build output will be in `.next/` directory

3. Deploy to your hosting provider (supports Node.js)

### Environment Variables for Production
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_production_mapbox_token
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support for map rendering.

## Contributing

We welcome contributions that help preserve historical memory and improve the educational value of this project.

**New collaborators: start with [`docs/ONBOARDING.md`](docs/ONBOARDING.md)** — it covers setup, ground rules, and all contribution tracks (code, research, outreach, translation). See also [`docs/OUTREACH_TRACKING.md`](docs/OUTREACH_TRACKING.md) for the memorial plaque outreach workflow, [`docs/TASK_TRACKING.md`](docs/TASK_TRACKING.md) for how tasks are organized, and the `/collaborate` page in the app for a quick overview.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read `IMPLEMENTATION_NOTES.md` for technical details before contributing.

## Historical Context

This project documents a difficult period in history. The visualization aims to:
- Preserve the memory of Jewish businesses and their contributions
- Provide educational resources about the impact of historical events
- Present information objectively and respectfully

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Historical data providers and archives
- Mapbox for mapping infrastructure
- Next.js team for the framework
- Contributors and researchers who helped gather historical information

## Support

For questions or issues:
- Open an issue on GitHub
- Check `IMPLEMENTATION_NOTES.md` for technical documentation
- Review `PERFORMANCE_RULES.md` for optimization guidelines

---

**Note**: This project handles sensitive historical data. Please treat all information with appropriate respect and historical accuracy.