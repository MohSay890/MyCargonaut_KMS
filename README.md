# MyCargonaut_KMS

my-cargonaut-repo/
├── .github/
│   └── workflows/          # Your CI/CD pipeline files (ci.yml)
├── backend/                # Spring Boot Project
│   ├── src/
│   ├── pom.xml (or build.gradle)
│   └── Dockerfile
├── frontend/               # Angular Project
│   ├── src/
│   ├── package.json
│   ├── jest.config.js
│   └── Dockerfile
├── e2e/                    # Playwright tests (End-to-End)
├── docker-compose.yml      # Runs PostgreSQL + App locally
└── README.md
