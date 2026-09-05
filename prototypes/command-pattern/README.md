# Command Pattern prototype

Este prototipo implementa `SubmitAnswerCommand` como orquestador del caso de uso **Submit Answer + Adapt**.

## Flujo

```text
StudyActionInvoker
  -> SubmitAnswerCommand
       -> LearningSession (validación y Attempt durable)
       -> AssessmentService (evaluación)
       -> LearnerServicePort (evidencia y Knowledge State)
       -> AdaptiveEngine (siguiente acción)
```

El comando no contiene fórmulas de mastery, reglas de evaluación ni estrategia pedagógica. Tampoco conoce HTTP, bases de datos o colas.

## Confiabilidad modelada

- `clientActionId` evita múltiples Attempts para una misma acción lógica.
- Reutilizar ese ID con un payload distinto produce `DuplicateActionError`.
- `originAttemptId` hace idempotente la evidencia en el Learner fake.
- El Attempt se guarda antes de propagar evidencia.
- Si Learner falla, el Attempt queda con evidencia `PENDING` y el retry continúa hacia adelante.
- Si Adaptive Engine falla, la evidencia ya registrada no se reenvía.
- `expectedSessionVersion` rechaza acciones stale, incluyendo carreras concurrentes.
- Un resultado completado se devuelve directamente en retries posteriores.

## Ejecución

```bash
npm ci
npm run typecheck
npm test
npm run demo
```
