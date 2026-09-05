# KnowNext

KnowNext es una propuesta de plataforma de aprendizaje adaptativo. Su objetivo es comprender qué sabe una persona, qué quiere aprender y decidir continuamente cuál debería ser su siguiente acción de aprendizaje.

Este repositorio contiene prototipos ejecutables usados para validar decisiones de arquitectura y patrones de diseño. La implementación disponible actualmente demuestra el patrón de comportamiento **Command** mediante el caso de uso **Submit Answer + Adapt**.

## Modelo conceptual

KnowNext separa cuatro responsabilidades principales:

- **Knowledge Service:** conocimiento canónico y Shared Concept Graph.
- **Learner Service:** Knowledge Twin global, Evidence y Mastery del estudiante.
- **Learning Service:** Goals, Sessions, Attempts, Commands y decisiones adaptativas.
- **Content / Grounding Service:** fuentes, extracción, retrieval y provenance.

El prototipo de este repositorio pertenece conceptualmente a **Learning Service**. Sus integraciones externas están representadas mediante interfaces e implementaciones in-memory; no despliega microservicios reales.

## Prototipo del patrón Command

La implementación se encuentra en [`prototypes/command-pattern`](./prototypes/command-pattern).

`SubmitAnswerCommand` encapsula la coordinación del caso de uso sin absorber las reglas especializadas de sus colaboradores:

```text
StudyActionInvoker
        |
        v
SubmitAnswerCommand
        |
        +--> LearningSession      valida la acción y registra el Attempt
        +--> AssessmentService    evalúa la respuesta
        +--> LearnerServicePort   registra Evidence y consulta Knowledge State
        +--> AdaptiveEngine       elige la siguiente acción de aprendizaje
```

El flujo ejecutado es:

```text
validar Session
      -> evaluar respuesta
      -> registrar Attempt durable
      -> propagar Evidence
      -> consultar Knowledge State
      -> elegir Next Learning Action
      -> devolver StudyActionResult
```

El Invoker sólo conoce el contrato `StudyCommand<TResult>` y delega en `execute()`. El Command coordina el workflow, pero no contiene fórmulas de Mastery, algoritmos pedagógicos, lógica HTTP ni acceso a bases de datos.

## Confiabilidad demostrada

El prototipo modela explícitamente:

- Idempotencia de la acción mediante `clientActionId`.
- Detección del uso conflictivo de un mismo ID con otro payload.
- Evidence idempotente mediante `originAttemptId`.
- Conservación del Attempt cuando Learner Service falla.
- Recuperación hacia adelante mediante retry.
- Reintento del Adaptive Engine sin reenviar Evidence.
- Rechazo de acciones stale mediante `expectedSessionVersion`.
- Protección ante dos acciones concurrentes sobre la misma versión.

## Requisitos

- Node.js y npm.

Las versiones exactas de las dependencias se encuentran fijadas en `package-lock.json`.

## Instalación y ejecución

Desde la raíz del repositorio:

```bash
cd prototypes/command-pattern
npm ci
```

Verificar tipos:

```bash
npm run typecheck
```

Ejecutar las pruebas:

```bash
npm test
```

Mostrar cada escenario probado:

```bash
npm test -- --reporter=verbose
```

Ejecutar la demostración:

```bash
npm run demo
```

También es posible ejecutar los scripts desde la raíz sin cambiar de directorio:

```bash
npm --prefix prototypes/command-pattern run typecheck
npm --prefix prototypes/command-pattern test
npm --prefix prototypes/command-pattern run demo
```

## Resultado esperado de la demo

```json
{
  "attemptId": "session-100-attempt-1",
  "assessment": {
    "conceptId": "fractions",
    "isCorrect": true,
    "score": 1,
    "feedback": "Correct answer"
  },
  "nextAction": {
    "type": "PRACTICE",
    "conceptId": "fractions",
    "description": "Solve a fraction comparison exercise"
  }
}
```

La ejecución también debe informar:

```text
Evidence sent: 1
Attempts recorded: 1
```

## Estructura principal

```text
prototypes/command-pattern/
├── src/
│   ├── application/     # Invoker
│   ├── commands/        # Command y ConcreteCommand
│   ├── domain/          # Session, Attempt, Assessment, tipos y errores
│   ├── fakes/           # Implementaciones in-memory
│   ├── ports/           # Frontera con Learner Service
│   ├── services/        # Contrato del Adaptive Engine
│   └── demo.ts
└── tests/
    ├── StudyActionInvoker.test.ts
    └── SubmitAnswerCommand.test.ts
```

Para más detalles del diseño y de cada invariante, consulta el [README del prototipo](./prototypes/command-pattern/README.md).

## Alcance

Este código es un prototipo arquitectónico. Deliberadamente no incluye base de datos, HTTP, BFF real, autenticación, colas, Event Sourcing, Saga ni despliegue de microservicios. Estas omisiones permiten evaluar el patrón Command y sus fronteras sin confundirlo con infraestructura de producción.
