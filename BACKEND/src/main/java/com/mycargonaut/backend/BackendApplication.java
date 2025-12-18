package com.mycargonaut.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    // Wir überschreiben die PostgreSQL-Einstellung mit H2 (nur für diesen Test)
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
        // Wenn die App hochfährt (Context lädt), ist der Test bestanden.
    }
}
