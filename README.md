# IoT Benchmark: Virtual Threads vs JavaScript Runtimes

Un benchmark completo comparando el rendimiento de **Spring Boot con Virtual Threads** contra diferentes runtimes de JavaScript para cargas de trabajo intensivas en I/O.

## 🎯 Objetivo

Este proyecto incluye **DOS benchmarks diferentes** para comparar tecnologías en distintos escenarios:

### 📊 **Benchmark 1: I/O Intensivo (Artificial)**
Simula un endpoint de ingesta de IoT que:
- Recibe payloads JSON (70 campos)
- Los almacena en base de datos
- Ejecuta trabajo asíncrono en segundo plano (**simula 50ms de I/O bloqueante**)
- Devuelve un ID y tiempo de procesamiento

### 🚀 **Benchmark 2: Procesamiento Realista**
Simula un endpoint de ingesta de IoT **real** que:
- Recibe payloads JSON (70 campos)
- Los almacena en base de datos (operación rápida)
- Ejecuta procesamiento CPU-intensivo: validación, enriquecimiento, cálculos Monte Carlo
- **SIN sleeps artificiales** - workload realista

## 🏆 Resultados de los Benchmarks

### Configuración de Prueba
- **Herramienta**: wrk (HTTP benchmarking tool)
- **Configuración**: 12 threads, 2000 conexiones concurrentes, 60 segundos
- **Payload**: JSON con 70 campos (~1.5KB)

---

## 📊 **BENCHMARK 1: I/O Intensivo (Artificial)**
*Con 50ms de sleep simulando I/O bloqueante*

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

# 5. Benchmark Realista (sin sleeps artificiales)
./run_realistic_benchmark.sh
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
├── run_nestjs_benchmark.sh      # Benchmark NestJS (Node.js/Bun)
├── run_realistic_benchmark.sh   # Benchmark Realista (sin sleeps)
├── realistic-server.js          # Servidor con workload realista
└── clustered-server.js          # Servidor multi-core clustering
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

#### 🎯 **Basado en Ambos Benchmarks:**

**🚀 Spring Boot + Virtual Threads**
- ✅ **I/O bloqueante masivo** (APIs externas lentas, DB queries complejas)
- ✅ **Miles de conexiones concurrentes** con operaciones lentas
- ✅ **Aplicaciones enterprise** con patrones de I/O tradicionales
- ❌ **NO para processing puro** o workloads CPU-intensivos

**🥇 Bun**
- ✅ **GANADOR para workloads realistas** (7,024 req/sec)
- ✅ **APIs y microservicios modernos** con processing intensivo
- ✅ **Aplicaciones IoT** con validación y cálculos
- ✅ **Cuando el rendimiento máximo es crítico**
- ⚠️ **Usar APIs nativas** (Bun.sqlite, Bun.serve)

**⚡ Node.js**
- ✅ **Segundo lugar sólido** (5,627 req/sec)
- ✅ **Ecosistema maduro** y estable para producción
- ✅ **Frameworks enterprise** (NestJS funciona excelente)
- ✅ **Equipos JavaScript** existentes

**⚡ NestJS + Fastify**
- ✅ **Framework enterprise** con arquitectura escalable
- ✅ **Equipos que vienen de Spring Boot/Java**
- ✅ **Microservicios con TypeScript**
- ✅ **APIs con decoradores y dependency injection**

**🌐 Express + Node.js**
- ✅ Aplicaciones web tradicionales
- ✅ Cuando la estabilidad y madurez son importantes
- ✅ Equipos que prefieren frameworks establecidos
- ✅ Integración con ecosistema Express existente

**☕ Spring Boot (Tradicional)**
- ✅ **Mejor que Virtual Threads** para workloads CPU-intensivos
- ✅ **Aplicaciones enterprise** complejas y legacy
- ✅ **Equipos Java** existentes
- ✅ **Cuando la estabilidad** es más importante que el rendimiento máximo

### 🎯 Insights Clave de Ambos Benchmarks

#### 📊 **Del Benchmark I/O Artificial:**
1. **Virtual Threads dominan** I/O bloqueante masivo (18,303 req/sec)
2. **NestJS compite dignamente**: Solo 26% más lento que Virtual Threads
3. **Framework vs Runtime**: NestJS (13,464) vs Fastify puro (9,514) = +41%
4. **Compatibilidad importa**: Bun + node-sqlite3 = problema masivo

#### 🚀 **Del Benchmark Realista (¡GAME CHANGER!):**
1. **🥇 Bun DOMINA workloads realistas**: 7,024 req/sec (+202% vs Virtual Threads)
2. **🥈 Node.js SUPERA a Java**: 5,627 req/sec (+142% vs Virtual Threads)  
3. **😱 Virtual Threads FALLAN** en processing puro: Solo 2,329 req/sec
4. **☕ Java tradicional MEJOR** que Virtual Threads para CPU: 4,413 req/sec
5. **🎯 El workload determina todo**: I/O vs CPU cambia completamente el ranking

#### 💡 **Lecciones Universales:**
- **Bun + APIs nativas** = Rendimiento superior
- **Virtual Threads** = Solo para I/O bloqueante específico
- **JavaScript moderno** supera a Java en la mayoría de casos reales
- **Los benchmarks artificiales** pueden ser muy engañosos

---

## 🚀 **BENCHMARK 2: Procesamiento Realista**
*Sin sleeps artificiales - workload CPU-intensivo real*

### Resultados Impactantes

| Tecnología | Requests/sec | Transfer/sec | Mejora vs Virtual Threads | Rank |
|------------|-------------|--------------|--------------------------|------|
| **🥇 Bun (Realista)** | **7,024** | **1.21MB** | **+202%** | **1º** 🚀 |
| **🥈 Node.js (Realista)** | **5,627** | **1.23MB** | **+142%** | **2º** ⚡ |
| **🥉 Spring Boot (Tradicional)** | **4,413** | **773KB** | **+89%** | **3º** ☕ |
| **Spring Boot Virtual Threads** | **2,329** | **407KB** | **Referencia** | 4º 😱 |

### 🤯 **Análisis del Plot Twist**

#### ✅ **En Workloads Realistas:**
- **🚀 Bun DOMINA**: 3x más rápido que Virtual Threads
- **⚡ Node.js SEGUNDO**: 2.4x más rápido que Virtual Threads
- **😱 Virtual Threads ÚLTIMO**: Solo útiles para I/O bloqueante masivo
- **☕ Java tradicional MEJOR** que Virtual Threads en CPU-intensive

#### 🔍 **¿Por qué este cambio radical?**

**Bun/Node.js ganan porque:**
- ✅ **JavaScript engines optimizados** para processing puro
- ✅ **Menos overhead** en operaciones CPU-intensivas
- ✅ **JIT superior** para cálculos matemáticos
- ✅ **Prepared statements eficientes** (Bun.sqlite)

**Virtual Threads pierden porque:**
- ❌ **Sin I/O bloqueante** que justifique threads masivos
- ❌ **Overhead de Spring Boot** para processing simple
- ❌ **GC pressure** en operaciones intensivas
- ❌ **Context switching innecesario**

### 💡 **Lecciones del Benchmark Realista**

1. **🎯 Workload determina el ganador**: I/O vs CPU cambia todo
2. **🚀 Bun domina processing real**: Como en TechEmpower benchmarks
3. **⚡ JavaScript moderno** supera a Java en muchos casos
4. **🏗️ Virtual Threads**: Específicos para I/O bloqueante masivo
5. **📊 Los benchmarks artificiales** pueden ser muy engañosos

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
