package com.mycargonaut.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles; // <--- WICHTIG

// Wir sagen Spring: "Tu so, als wären wir im 'test'-Profil (das leer ist)"
// Damit wird 'dev' und damit PostgreSQL ignoriert.
@ActiveProfiles("test")
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=password",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }
}
