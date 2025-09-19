# IoT Benchmark: Virtual Threads vs JavaScript Runtimes

Un benchmark completo comparando el rendimiento de **Spring Boot con Virtual Threads** contra diferentes runtimes de JavaScript para cargas de trabajo intensivas en I/O.

## 🎯 Objetivo

Este benchmark simula un endpoint de ingesta de IoT que:
- Recibe payloads JSON (70 campos)
- Los almacena en base de datos
- Ejecuta trabajo asíncrono en segundo plano (simula 50ms de I/O bloqueante)
- Devuelve un ID y tiempo de procesamiento

## 🏆 Resultados del Benchmark

### Configuración de Prueba
- **Herramienta**: wrk (HTTP benchmarking tool)
- **Configuración**: 12 threads, 2000 conexiones concurrentes, 60 segundos
- **Payload**: JSON con 70 campos (~1.5KB)
- **I/O Simulado**: 50ms de `Thread.sleep()` / `setTimeout()`

### Resultados Completos

| Tecnología | Requests/sec | Transfer/sec | Latencia (avg) | Timeouts | Rank |
|------------|-------------|--------------|---------------|-----------|------|
| **🥇 Spring Boot + Virtual Threads** | **18,303** | **3.13MB** | 186ms | 8,769 | **1º** |
| **🥈 Fastify + Node.js** | **9,514** | **2.08MB** | 136ms | 1,174 | **2º** |
| **🥉 Express + Node.js** | **6,239** | **1.74MB** | 165ms | 1,024 | **3º** |
| **Fastify + Bun** | **4,200** | **745KB** | 450ms | 0 | 4º |
| **Spring Boot (Tradicional)** | **3,970** | **695KB** | 156ms | 8,892 | 5º |

## 📊 Análisis de Rendimiento

### 🚀 Spring Boot con Virtual Threads
- **Ganador absoluto** con 18,303 req/sec
- **4.6x más rápido** que Spring Boot tradicional
- **1.9x más rápido** que la mejor opción de JavaScript
- Ideal para aplicaciones con alta concurrencia e I/O intensivo

### ⚡ Fastify + Node.js
- **Segundo lugar** con 9,514 req/sec
- **53% más rápido** que Express
- Excelente balance entre rendimiento y ecosistema
- Latencia más baja (136ms)

### 🌐 Express + Node.js
- **Tercer lugar** con 6,239 req/sec
- **57% más rápido** que Spring Boot tradicional
- Framework más maduro y adoptado
- Buen rendimiento general

### 🔥 Fastify + Bun
- **Cuarto lugar** con 4,200 req/sec
- Rendimiento sorprendentemente bajo para este caso de uso
- Posibles problemas de compatibilidad con SQLite3
- Mejor para tareas intensivas en CPU

### ☕ Spring Boot Tradicional
- **Último lugar** con 3,970 req/sec
- Limitado por el pool de threads tradicional
- Muchos timeouts (8,892) por agotamiento del pool
- Demuestra la importancia de Virtual Threads

## 🛠️ Cómo Ejecutar el Benchmark

### Prerrequisitos

```bash
# macOS
brew install node
brew install wrk
curl -fsSL https://bun.sh/install | bash

# Java 21+ requerido para Virtual Threads
java --version
```

### Ejecutar Benchmarks

```bash
# Clonar/descargar el proyecto
cd iot-bench

# 1. Spring Boot (Virtual Threads ON/OFF)
./run_benchmark_fixed.sh

# 2. Express + Node.js
./run_nodejs_benchmark.sh

# 3. Fastify (Node.js o Bun) - interactivo
./run_js_benchmark.sh
```

## 📁 Estructura del Proyecto

```
iot-bench/
├── README.md                    # Este archivo
├── pom.xml                      # Configuración Maven
├── package.json                 # Dependencias Node.js
├── generate_payload.py          # Generador de payload JSON
├── post.lua                     # Script wrk para POST requests
│
├── src/main/java/com/example/iotbench/
│   ├── IotBenchApplication.java # Aplicación Spring Boot
│   ├── IngestController.java    # Controlador REST
│   ├── IngestService.java       # Lógica de negocio
│   └── AsyncWorker.java         # Trabajo asíncrono
│
├── src/main/resources/
│   └── application.yml          # Configuración Spring Boot
│
├── nodejs-server.js             # Servidor Fastify
├── run_benchmark_fixed.sh       # Benchmark Spring Boot
├── run_nodejs_benchmark.sh      # Benchmark Express
└── run_js_benchmark.sh          # Benchmark Fastify (Node.js/Bun)
```

## 🔧 Configuración Técnica

### Spring Boot
- **Java 21** con Virtual Threads habilitados
- **H2 Database** (in-memory)
- **HikariCP** connection pool
- **Tomcat** embedded server

### Node.js/Bun
- **Fastify 4.24.3** (framework web rápido)
- **SQLite3** (in-memory, equivalente a H2)
- **UUID v4** para generación de IDs

### Payload de Prueba
```json
{
  "field1": "value1",
  "field2": "value2",
  ...
  "field70": "value70"
}
```

## 💡 Conclusiones

### ✅ Cuándo Usar Cada Tecnología

**🚀 Spring Boot + Virtual Threads**
- ✅ Aplicaciones enterprise con alta concurrencia
- ✅ Microservicios con mucho I/O (DB, APIs externas)
- ✅ Cuando el rendimiento máximo es crítico
- ✅ Equipos con experiencia en Java/Spring

**⚡ Fastify + Node.js**
- ✅ APIs REST rápidas y eficientes
- ✅ Desarrollo rápido con ecosistema JavaScript
- ✅ Equipos full-stack JavaScript
- ✅ Prototipado y MVP

**🌐 Express + Node.js**
- ✅ Aplicaciones web tradicionales
- ✅ Cuando la estabilidad y madurez son importantes
- ✅ Equipos que prefieren frameworks establecidos
- ✅ Integración con ecosistema Express existente

**🔥 Bun**
- ✅ Tareas intensivas en CPU
- ✅ Scripts y herramientas de desarrollo
- ✅ Cuando la velocidad de startup es importante
- ❌ No recomendado para este tipo de I/O (por ahora)

### 🎯 Insights Clave

1. **Virtual Threads son revolucionarios** para I/O intensivo
2. **La elección de framework importa**: Fastify vs Express (+53%)
3. **JavaScript sigue siendo competitivo** para muchos casos de uso
4. **Bun necesita más madurez** para este tipo de cargas de trabajo
5. **Los threads tradicionales son un cuello de botella** real

## 📈 Mejoras Futuras

- [ ] Benchmark con bases de datos reales (PostgreSQL, MySQL)
- [ ] Pruebas con diferentes tamaños de payload
- [ ] Comparación con otros frameworks (Vert.x, Quarkus, Go, Rust)
- [ ] Métricas de uso de memoria y CPU
- [ ] Pruebas de carga sostenida (stress testing)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de:
- Agregar nuevos frameworks/runtimes
- Mejorar la configuración del benchmark
- Optimizar el código existente
- Reportar issues o sugerencias

---

**Nota**: Los resultados pueden variar según el hardware, sistema operativo y configuración. Este benchmark fue ejecutado en macOS con Apple Silicon.
