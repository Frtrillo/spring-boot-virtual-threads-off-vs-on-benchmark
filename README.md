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

#### 🏛️ Comparación Framework vs Framework
| Framework | Runtime | Requests/sec | Transfer/sec | Latencia (avg) | Timeouts | Rank |
|-----------|---------|-------------|--------------|---------------|-----------|------|
| **🥇 Spring Boot + Virtual Threads** | Java 21 | **18,303** | **3.13MB** | 186ms | 8,769 | **1º** |
| **🥈 NestJS + Fastify** | Node.js | **13,464** | **3.00MB** | 112ms | 1,070 | **2º** |
| **🥉 Bun Nativo** | Bun (APIs nativas) | **12,471** | **1.96MB** | 154ms | 0 | **3º** |
| **NestJS + Fastify** | Bun | **12,649** | **2.24MB** | 155ms | 0 | 4º |
| **Spring Boot (Tradicional)** | Java 21 | **3,970** | **695KB** | 156ms | 8,892 | 4º |

#### 🚀 Comparación Runtime Puro vs Framework
| Tecnología | Tipo | Requests/sec | Transfer/sec | Latencia (avg) | Timeouts |
|------------|------|-------------|--------------|---------------|-----------|
| **Fastify** | Runtime Puro (Node.js) | **9,514** | **2.08MB** | 136ms | 1,174 |
| **Express** | Runtime Puro (Node.js) | **6,239** | **1.74MB** | 165ms | 1,024 |
| **Fastify** | Runtime Puro (Bun) | **4,200** | **745KB** | 450ms | 0 |

## 📊 Análisis de Rendimiento

### 🚀 Spring Boot con Virtual Threads
- **Ganador absoluto** con 18,303 req/sec
- **4.6x más rápido** que Spring Boot tradicional
- **1.9x más rápido** que la mejor opción de JavaScript
- Ideal para aplicaciones con alta concurrencia e I/O intensivo

### ⚡ NestJS + Fastify
- **Segundo lugar** con 13,464 req/sec (Node.js) y 12,649 req/sec (Bun)
- **Framework enterprise** con arquitectura similar a Spring Boot
- **Comparación justa**: Framework vs Framework
- **Latencia excelente** (112ms con Node.js)
- **41% más rápido** con Node.js que con Bun en este caso de uso

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

# 4. NestJS + Fastify (Node.js o Bun) - interactivo
./run_nestjs_benchmark.sh
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
├── nodejs-server.js             # Servidor Fastify puro
├── nestjs-server.ts             # Servidor NestJS + Fastify
├── *.ts                         # Módulos NestJS (controllers, services)
├── run_benchmark_fixed.sh       # Benchmark Spring Boot
├── run_nodejs_benchmark.sh      # Benchmark Express
├── run_js_benchmark.sh          # Benchmark Fastify (Node.js/Bun)
└── run_nestjs_benchmark.sh      # Benchmark NestJS (Node.js/Bun)
```

## 🔧 Configuración Técnica

### Spring Boot
- **Java 21** con Virtual Threads habilitados
- **H2 Database** (in-memory)
- **HikariCP** connection pool
- **Tomcat** embedded server

### NestJS + Fastify
- **NestJS 10.2.8** (framework enterprise con decoradores)
- **Fastify Adapter** para máximo rendimiento
- **TypeScript** con tipado fuerte
- **Dependency Injection** y arquitectura modular
- **SQLite3** (in-memory, equivalente a H2)

### Node.js/Bun Puro
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

**⚡ NestJS + Fastify**
- ✅ Aplicaciones enterprise con arquitectura escalable
- ✅ Equipos que vienen de Spring Boot/Java
- ✅ Microservicios con TypeScript
- ✅ APIs con decoradores y dependency injection
- ✅ Desarrollo full-stack con tipado fuerte

**🌐 Express + Node.js**
- ✅ Aplicaciones web tradicionales
- ✅ Cuando la estabilidad y madurez son importantes
- ✅ Equipos que prefieren frameworks establecidos
- ✅ Integración con ecosistema Express existente

**🔥 Bun**
- ✅ **Cuando usas APIs nativas de Bun** (Bun.sqlite, Bun.serve)
- ✅ Tareas intensivas en CPU y I/O (con APIs correctas)
- ✅ Scripts y herramientas de desarrollo
- ✅ Cuando la velocidad de startup es importante
- ⚠️ **Evitar dependencias de Node.js** (usar equivalentes nativos)

### 🎯 Insights Clave

1. **Virtual Threads siguen siendo los reyes** del I/O intensivo
2. **NestJS compite dignamente**: Solo 26% más lento que Virtual Threads
3. **Bun ES más rápido... cuando usa APIs nativas**: 31% mejor que Node.js
4. **Compatibilidad importa**: Bun + node-sqlite3 = problema masivo (-66% rendimiento)
5. **Framework vs Runtime**: NestJS (13,464) vs Fastify puro (9,514) = +41%
6. **La elección de dependencias es crítica**: APIs nativas vs bindings de Node.js
7. **TypeScript + Enterprise patterns** son viables para alta performance

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
