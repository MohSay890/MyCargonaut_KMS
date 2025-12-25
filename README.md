# MyCargonaut_KMS

Knowledge Management System for MyCargonaut - A full-stack application with Spring Boot backend and Angular frontend.

## Project Structure

```text
MyCargonaut_KMS/
├── .github/
│   └── workflows/          # CI/CD pipeline (Java 21 + Angular tests)
├── BACKEND/                # Spring Boot 3.2.0 (Java 21)
│   ├── src/
│   ├── pom.xml
│   └── README.md           # Backend-specific documentation
├── FRONTEND/               # Angular (Node.js 18+)
│   ├── src/
│   ├── package.json
│   └── README.md           # Frontend-specific documentation
|── DESIGN/                 # Angular (Node.js 18+)
│   ├── mockups/            # HTML/CSS mockups
│   └── wireframes/         # High-fidelity wireframe sketches
├── docker-compose.yml      # PostgreSQL database setup
└── README.md               # This file
```

## Design & Prototypes
Before development, we established the visual structure of the application. You can find these assets in the `DESIGN` folder at the project root:

- **Wireframes**: Low-fidelity sketches outlining the layout.
  - 📂 Location: [`DESIGN/wireframes/`](./DESIGN/wireframes/)
- **Mockups**: High-fidelity static designs using HTML & CSS.
  - 📂 Location: [`DESIGN/mockup/`](./DESIGN/mockup/)


## Prerequisites

Before you begin, ensure you have the following installed:

- **Java 21** (LTS) - [Download](https://adoptium.net/)
- **Maven 3.9+** - [Download](https://maven.apache.org/download.cgi)
- **Node.js 18+** and **npm** - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/downloads)

## Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/MohSay890/MyCargonaut_KMS.git
cd MyCargonaut_KMS
```

### 2️⃣ Set Up the Database

Start the PostgreSQL database using Docker Compose:

```bash
docker-compose up -d
```

This will start PostgreSQL on `localhost:5432` with:
- Database: `mycargonaut`
- Username: `admin`
- Password: `password`

Verify the database is running:
```bash
docker ps
```

### 3️⃣ Set Up the Backend

Navigate to the backend directory:

```bash
cd BACKEND
```

Build the project:
```bash
mvn clean install
```

Run the Spring Boot application:
```bash
mvn spring-boot:run
```

The backend will start on **http://localhost:8080**

**Verify backend is running:**
- Open: http://localhost:8080/api/health
- You should see: `{"status":"UP",...}`

### 4️⃣ Set Up the Frontend

Open a **new terminal** and navigate to the frontend directory:

```bash
cd FRONTEND
```

Install dependencies:
```bash
npm install
```

Start the Angular development server:
```bash
npm start
```

The frontend will start on **http://localhost:4200**

**Verify frontend is running:**
- Open: http://localhost:4200
- You should see the Angular welcome page

## Quick Start Summary

After cloning, run these commands in order:

```bash
# Terminal 1: Start database
docker-compose up -d

# Terminal 2: Start backend
cd BACKEND
mvn spring-boot:run

# Terminal 3: Start frontend
cd FRONTEND
npm install
npm start
```

## Development Workflow

### Backend Development
- Code is in `BACKEND/src/main/java/com/mycargonaut/backend/`
- Tests are in `BACKEND/src/test/`
- Run tests: `mvn test`
- See [BACKEND/README.md](BACKEND/README.md) for more details

### Frontend Development
- Code is in `FRONTEND/src/app/`
- Run tests: `npm test`
- Build for production: `npm run build`
- See [FRONTEND/README.md](FRONTEND/README.md) for more details

## Technology Stack

### Backend
- **Java**: 21 (LTS)
- **Spring Boot**: 3.2.0
- **Database**: PostgreSQL 15
- **Build Tool**: Maven

### Frontend
- **Framework**: Angular
- **Language**: TypeScript
- **Package Manager**: npm

## Common Issues & Solutions

### Database Connection Error
- Ensure Docker is running: `docker ps`
- Restart database: `docker-compose restart`

### Backend Port Already in Use (8080)
- Find and kill the process: `lsof -i :8080` (Mac/Linux) or `netstat -ano | findstr :8080` (Windows)
- Or change port in `BACKEND/src/main/resources/application.properties`

### Frontend Port Already in Use (4200)
- Angular will automatically suggest port 4201
- Or specify port: `ng serve --port 4201`

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration:
- **Backend**: Builds and tests with Maven (Java 21)
- **Frontend**: Runs unit tests with Jest

Pipeline runs on push/PR to `main` and `develop` branches.

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m "Add your feature"`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

MIT
