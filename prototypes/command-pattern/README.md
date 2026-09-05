# Prototipo del patrón Command

Implementación TypeScript del patrón de comportamiento **Command** aplicado al caso de uso **Submit Answer + Adapt** de KnowNext.

## Objetivo

El prototipo evita que un endpoint o BFF tenga que conocer el workflow completo de una acción de estudio. `SubmitAnswerCommand` encapsula su coordinación detrás de `execute()`, mientras cada colaborador conserva sus reglas.

```text
StudyActionInvoker
  -> StudyCommand<TResult>
       -> SubmitAnswerCommand
            -> LearningSession
            -> AssessmentService
            -> LearnerServicePort
            -> AdaptiveEngine
```

## Participantes

| Participante GoF | Implementación | Responsabilidad |
|---|---|---|
| Command | `StudyCommand<TResult>` | Define el contrato `execute()` |
| ConcreteCommand | `SubmitAnswerCommand` | Coordina Submit Answer |
| Invoker | `StudyActionInvoker` | Delega en el Command |
| Receivers | Session, Assessment, Learner y Adaptive Engine | Ejecutan trabajo especializado |
| Client | `demo.ts` o una futura capa de aplicación | Construye el Command |

No existe una clase `Receiver` artificial. Los receivers son los componentes reales del dominio.

## Flujo de ejecución

```text
1. LearningSession valida estado, actividad y versión.
2. AssessmentService evalúa submittedAnswer.
3. LearningSession registra el Attempt durable.
4. LearnerServicePort registra Evidence.
5. LearnerServicePort devuelve Knowledge State.
6. AdaptiveEngine elige Next Learning Action.
7. SubmitAnswerCommand devuelve StudyActionResult.
```

El Command coordina este orden, pero no calcula Mastery, no implementa la evaluación ni contiene la estrategia pedagógica.

## Contratos principales

### Entrada

`SubmitAnswerInput` contiene:

- `clientActionId`: identifica la acción lógica para hacerla idempotente.
- `activityId`: actividad que está respondiendo el estudiante.
- `submittedAnswer`: respuesta enviada.
- `expectedSessionVersion`: protege contra acciones stale.

### Resultado

`StudyActionResult` contiene:

- `attemptId`.
- `assessment`.
- `nextAction`.

### Frontera con Learner Service

`LearnerServicePort` expone:

```ts
recordEvidence(evidence): Promise<void>
getKnowledgeState(learnerId, conceptId): Promise<KnowledgeState>
```

El Command depende de este contrato y no conoce HTTP, `fetch`, una base de datos ni detalles internos de Learner Service. Sólo Learner puede actualizar Mastery.

## Idempotencia y recuperación

- Un mismo `clientActionId` devuelve el resultado de la acción existente y no crea otro Attempt.
- Reutilizar ese ID con una respuesta diferente produce `DuplicateActionError`.
- `originAttemptId` evita aplicar Evidence más de una vez.
- El Attempt se registra antes de enviar Evidence.
- Si Learner falla, el Attempt permanece con Evidence `PENDING`.
- Un retry continúa desde el Attempt existente y recupera el flujo hacia adelante.
- Si Adaptive Engine falla después de registrar Evidence, el retry no vuelve a enviarla.
- `expectedSessionVersion` rechaza acciones obsoletas, incluso cuando dos acciones compiten concurrentemente.

## Estructura

```text
src/
├── application/
│   └── StudyActionInvoker.ts
├── commands/
│   ├── StudyCommand.ts
│   └── SubmitAnswerCommand.ts
├── domain/
│   ├── AssessmentService.ts
│   ├── Attempt.ts
│   ├── errors.ts
│   ├── LearningSession.ts
│   └── types.ts
├── fakes/
│   ├── InMemoryAdaptiveEngine.ts
│   └── InMemoryLearnerService.ts
├── ports/
│   └── LearnerServicePort.ts
├── services/
│   └── AdaptiveEngine.ts
└── demo.ts
```

## Instalación

```bash
npm ci
```

## Verificación

```bash
npm run typecheck
npm test
npm run demo
```

Para utilizar nombres de prueba descriptivos como evidencia:

```bash
npm test -- --reporter=verbose
```

La suite contiene 11 pruebas distribuidas en dos archivos. Cubre:

- Delegación del Invoker.
- Flujo completo y orden de colaboración.
- Session pausada.
- Acción stale.
- Idempotencia por `clientActionId`.
- Conflicto de payload.
- Fallo y recuperación de Learner Service.
- Evidence idempotente.
- Fallo y retry del Adaptive Engine.
- Concurrencia sobre una misma versión.

## Límites deliberados

Este prototipo no introduce:

- Base de datos o persistencia de producción.
- HTTP o BFF real.
- Colas o Command Bus distribuido.
- Saga, CQRS o Event Sourcing.
- State o Memento como implementaciones adicionales.
- Algoritmos reales de Mastery o políticas pedagógicas productivas.

Estas decisiones mantienen el foco en Command, sus límites y la recuperación del caso de uso.
