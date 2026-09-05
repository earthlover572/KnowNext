# KnowNext

Prototipos de arquitectura para la plataforma de aprendizaje adaptativo KnowNext.

## Command Pattern

La implementación actual vive en [`prototypes/command-pattern`](./prototypes/command-pattern). Modela el flujo de envío de una respuesta manteniendo `SubmitAnswerCommand` como coordinador de dominio, con idempotencia y recuperación hacia adelante ante fallos del Learner Service.

```bash
cd prototypes/command-pattern
npm ci
npm run typecheck
npm test
npm run demo
```
