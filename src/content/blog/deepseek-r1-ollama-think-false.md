---
title: "DeepSeek-R1 en Ollama: think false no apaga el razonamiento"
description: "En Ollama, DeepSeek-R1 ignora think: false y tools sin dar error, y reasoning_content llega undefined. Causa medida y arreglos probados con Node."
slug: deepseek-r1-ollama-think-false
pubDate: 2026-11-03
tags: [deepseek, ollama, node, ia]
draft: false
---

Con `deepseek-r1:1.5b` en Ollama 0.40.14, una petición con `think: false` generó 273 tokens y siguió razonando. La misma petición con la plantilla correcta generó 13. En ese mismo montaje, `message.reasoning_content` llega `undefined` y las `tools` se ignoran con HTTP 200.

Nada de esto da error. Aquí están las mediciones, la causa y lo que funcionó.

## El problema

La prueba usa Ollama 0.40.14 en Docker, sin GPU, y el SDK `openai` 7.49 con Node 22.19. El código está escrito según el [contrato de DeepSeek](https://api-docs.deepseek.com/guides/thinking_mode/), que devuelve el razonamiento en `reasoning_content`:

```js
// probar.mjs
import OpenAI from 'openai';

const client = new OpenAI({ baseURL: 'http://127.0.0.1:11434/v1', apiKey: 'ollama' });

const { choices } = await client.chat.completions.create({
  model: 'deepseek-r1:1.5b',
  messages: [{ role: 'user', content: 'Cuanto es 17 + 25? Responde solo el numero.' }],
  temperature: 0,
});

const message = choices[0].message;
console.log(Object.keys(message));
console.log(message.reasoning_content);
```

```text
[ 'role', 'content', 'reasoning' ]
undefined
```

Ollama no documenta el nombre de ese campo en su [página de compatibilidad con OpenAI](https://docs.ollama.com/api/openai-compatibility). En la prueba es `reasoning`, también en streaming: 108 fragmentos con `delta.reasoning` y ninguno con `delta.reasoning_content`.

Lo demás se comporta así, siempre con la misma pregunta y `temperature: 0`. Justo después de cargar el modelo, la cifra de 273 bajó a veces a unos 244:

| Petición | Tokens generados | Resultado |
| --- | --- | --- |
| `/api/chat` con `think: false` | 273 | Razona igual y lo devuelve en `message.thinking` |
| `/api/generate` con `think: false` | 273 | `<think>` crudo dentro de `response` |
| `/api/generate` sin `think` | 273 | Separado y limpio |
| `/v1` con `reasoning_effort: "none"` | 273 | Razona igual |
| `/v1` con `thinking: { type: "disabled" }` | 273 | Razona igual |

Las dos filas de `/api/generate` son las más raras: pedir que no razone empeora la respuesta frente a no pedir nada. Es el mismo fallo del [issue #18044](https://github.com/ollama/ollama/issues/18044), que lo reporta en la versión 0.33.0 con `deepseek-r1:8b`.

Con las herramientas pasa algo parecido. `ollama show` declara `tools`, pero la definición nunca llega al modelo. El prompt ocupa lo mismo con ellas o sin ellas:

```text
sin tools  prompt_tokens 16
con tools  prompt_tokens 16
```

El modelo contesta sin saber que la herramienta existe, con `finish_reason: "stop"` y sin `tool_calls`.

### La causa: Ollama elige la plantilla equivocada

El comando `ollama show` ya lo deja ver:

```text
  Model
    architecture        qwen2
    parameters          1.8B
    context length      131072
    embedding length    1536
    quantization        Q4_K_M
    template source     gguf_chat_template

  Capabilities
    tools
    thinking
    completion
```

Este modelo trae dos plantillas. La [plantilla del registro](https://ollama.com/library/deepseek-r1) cierra el razonamiento antes de empezar cuando se pide `think: false`:

```text
{{- if and $.IsThinkSet (not $.Think) -}}
<think>

</think>

{{ end }}
```

La otra es la plantilla Jinja que viene dentro del GGUF, y no sabe nada de `think`. Tampoco escribe las definiciones de `tools` en el prompt, aunque sí contiene la cadena `tool_calls` para reproducir llamadas anteriores.

El fallo está en cómo se detecta esa capacidad. En [`server/images.go`](https://github.com/ollama/ollama/blob/v0.40.14/server/images.go), Ollama detecta el soporte de herramientas de la plantilla Jinja buscando una subcadena:

```go
// server/images.go
func chatTemplateHasToolSupport(chatTemplate string) bool {
	return strings.Contains(chatTemplate, "tools") || strings.Contains(chatTemplate, "tool_call")
}
```

Como la plantilla del GGUF parece tener una capacidad más, `shouldPreferChatTemplate` la prefiere a la del registro. Así se pierde `think: false` y se gana una capacidad `tools` que no hace nada.

En la versión 0.30.4 ya ocurre esto en `/api/chat` y `/v1`: 302 tokens con `think: false` y `tools` ignoradas. La fuga de `<think>` en `/api/generate` no aparece en esa versión (23 tokens y respuesta limpia), y sí en la 0.40.14. Las versiones intermedias no se midieron.

## La solución

Hay un error de contrato y otro de plantilla, y cada uno se arregla por separado: un adaptador para los campos y un bloque de razonamiento vacío para apagarlo.

### 1. Lee el razonamiento con un adaptador

Este módulo funciona con mensajes y con `delta` en streaming:

```ts
// src/lib/reasoning.ts
import type OpenAI from 'openai';

export type Provider = 'deepseek' | 'ollama';

type ReasoningFields = {
  reasoning?: string | null;
  reasoning_content?: string | null;
};
type AssistantMessage = OpenAI.Chat.Completions.ChatCompletionMessage & ReasoningFields;

// DeepSeek responde en reasoning_content; Ollama /v1, en reasoning.
export function readReasoning(source: object): string {
  const { reasoning_content, reasoning } = source as ReasoningFields;
  return reasoning_content ?? reasoning ?? '';
}

// Prepara el turno del asistente para reenviarlo, con el campo que lee cada servidor.
export function toAssistantTurn(provider: Provider, message: AssistantMessage) {
  const text = readReasoning(message);
  const { reasoning: _r, reasoning_content: _rc, ...turn } = message;
  if (!text) return turn;
  return provider === 'deepseek'
    ? { ...turn, reasoning_content: text }
    : { ...turn, reasoning: text };
}

// Último mensaje de la petición: DeepSeek-R1 arranca con el razonamiento ya cerrado.
export const SKIP_THINKING = {
  role: 'assistant',
  content: '<think>\n\n</think>\n\n',
} as const;
```

Se distinguen los dos proveedores al reenviar porque la API de DeepSeek [exige `reasoning_content`](https://api-docs.deepseek.com/guides/thinking_mode/) en las peticiones con `tools` y responde 400 si falta. Ollama hace lo contrario: lo acepta y lo descarta en silencio, como describe el [issue #18534](https://github.com/ollama/ollama/issues/18534) para su nube.

La asimetría también se ve en local, midiendo `prompt_tokens` con un mismo texto de unos 770 tokens en el último turno del asistente:

```text
--- /v1, asistente al final (turno actual), con OLLAMA_GO_TEMPLATE=1 ---
(sin campo)          7
reasoning_content    7
reasoning            781
thinking             7
```

Sin esa variable, con la plantilla del GGUF, los cuatro casos dan lo mismo: ningún campo llega al prompt.

Si en vez del SDK usas `node-fetch` y el stream se corta tras actualizar Node, la causa es otra: revisa [el error Premature close de node-fetch en Node 24.17](/blog/node-fetch-premature-close-node-24-17/).

### 2. Apaga el razonamiento desde la petición

Si la petición termina con un mensaje de asistente que trae el bloque vacío, el modelo continúa después de él. No requiere reiniciar el servidor y funciona con el SDK de OpenAI:

```ts
// src/lib/preguntar.ts
import OpenAI from 'openai';
import { SKIP_THINKING } from './reasoning.ts';

const client = new OpenAI({ baseURL: 'http://127.0.0.1:11434/v1', apiKey: 'ollama' });

const { choices, usage } = await client.chat.completions.create({
  model: 'deepseek-r1:1.5b',
  messages: [
    { role: 'user', content: 'Cuanto es 17 + 25? Responde solo el numero.' },
    SKIP_THINKING,
  ],
  temperature: 0,
});

console.log(usage?.completion_tokens, choices[0].message.content);
```

```text
15 17 + 25 es igual a **42**.
```

Con `temperature: 0`, esa pregunta varió entre 13 y 15 tokens según la corrida. En 5 preguntas distintas, `reasoning` llegó vacío siempre y `content` no trajo etiquetas `<think>`.

El costo es la calidad. Sin razonamiento, `deepseek-r1:1.5b` dio varias respuestas malas:

```text
La capital de Peru es el capital de la countrya de Peru, que es el capital de la statesuma
Para invertir un字符串 en JavaScript, puedes usar el método `split()` con dos parámetros.
```

Con este tag, el bloque vacío solo conviene para tareas muy simples o si lo que importa es la latencia. En tags más grandes no se midió.

### 3. O usa una instancia aparte con OLLAMA_GO_TEMPLATE=1

Si no puedes cambiar los mensajes, esta variable obliga a usar la plantilla del registro:

```bash
docker run -d --name ollama-r1 -e OLLAMA_GO_TEMPLATE=1 \
  -p 127.0.0.1:11435:11434 -v ollama:/root/.ollama ollama/ollama:0.40.14
```

Resultado, con la misma pregunta:

| Petición | Por defecto | `OLLAMA_GO_TEMPLATE=1` |
| --- | --- | --- |
| `template source` | `gguf_chat_template` | `go_template` |
| `/api/chat` con `think: false` | 273 tokens | 13 tokens, sin razonamiento |
| `/api/generate` con `think: false` | `<think>` en `response` | 13 tokens, limpio |
| `/v1` con `reasoning_effort: "none"` | 273 tokens | 13 tokens, sin razonamiento |
| `/v1` con `thinking: { type: "disabled" }` | 273 tokens | 273 tokens |
| Petición con `tools` | HTTP 200, ignoradas | HTTP 400 `does not support tools` |

El parámetro de DeepSeek (`thinking`) sigue sin efecto en los dos casos: en `/v1` el que cuenta es `reasoning_effort`.

La variable afecta a todos los modelos del servidor, y el [issue #19377](https://github.com/ollama/ollama/issues/19377) reportó un fallo con `qwen3` y `go_template` en llamadas a herramientas. Por eso aquí va en una instancia separada, en otro puerto, y no en la principal.

### 4. No cuentes con tools nativas en deepseek-r1

El error `does not support tools` es la respuesta correcta para este modelo: ninguna de sus dos plantillas le entrega las definiciones. Además, las [notas de la versión 0.32.0](https://github.com/ollama/ollama/releases/tag/v0.32.0) ya avisan de que los tags base de DeepSeek-R1 son modelos antiguos para agentes.

Se probó también forzar un renderer con este `Modelfile`:

```text
# Modelfile
FROM deepseek-r1:1.5b
RENDERER deepseek3.1
PARSER deepseek3
```

Las definiciones sí llegan al prompt (de 17 a 200 tokens), pero en 5 corridas con `deepseek-r1:1.5b` hubo 0 `tool_calls`. El modelo escribe tokens inventados como `<｜consult_inventario｜<｜{"sku": "A-100"}｜>`, sin que el parser los reconozca. Además, con ese renderer `think: false` empeora: genera 371 tokens y el razonamiento acaba dentro de `content`.

## Troubleshooting

### TEMPLATE en el Modelfile no cambia nada

Crear un modelo con `TEMPLATE` y el texto exacto de la plantilla oficial no sirvió: `ollama show` sigue diciendo `template source gguf_chat_template` y `think: false` sigue generando 273 tokens. La decisión de `shouldPreferChatTemplate` se basa en las capacidades de cada plantilla. Usa el bloque vacío o la variable.

### registry.ollama.ai/library/deepseek-r1:1.5b does not support tools

```text
{"error":{"message":"registry.ollama.ai/library/deepseek-r1:1.5b does not support tools","type":"invalid_request_error","param":null,"code":null}}
```

Si aparece justo después de activar `OLLAMA_GO_TEMPLATE=1`, no es una regresión. Antes las herramientas tampoco funcionaban, pero el servidor no lo decía. Quita `tools` de la petición para este modelo.

### content vacío con response_format

Con `response_format` de tipo `json_schema` y `max_tokens: 200`, la prueba devolvió `content: ""`: los 200 tokens se fueron en razonamiento (883 caracteres). El esquema no limita esa parte. Deja margen en `max_tokens`; en la prueba no se midió cuánto hace falta. Combinar `response_format` con `SKIP_THINKING` no sirvió: en 3 intentos la respuesta llegó sin `choices`.

### request exceeds the available context size

```text
request (4096 tokens) exceeds the available context size (4096 tokens), try increasing it
```

Aparece con HTTP 400 al enviar un prompt largo a `/v1`. No lo causa el razonamiento: `ollama show` anuncia un `context length` de 131072, pero el servidor trabajó con 4096 en esta prueba. El [issue #17889](https://github.com/ollama/ollama/issues/17889) trata esa misma diferencia.

Con un texto de unos 770 tokens el error no aparece, y con unos 4000 sí. Recorta el prompt. El mensaje sugiere aumentar el contexto, pero ese ajuste no se probó.

### Límites de esta prueba

Todo se midió con `deepseek-r1:1.5b`. Los tags `8b`, `14b`, `32b` y `latest` publican en el registro el mismo digest de plantilla (`c5ad996b`), y el issue #18044 ve el mismo patrón en `8b`, pero aquí no se ejecutaron. Tampoco se probó la API de pago de DeepSeek: el adaptador se validó contra Ollama real y, para la rama `deepseek`, contra un servidor simulado con el formato documentado. Los modelos DeepSeek V4 no se probaron: no aparecen en el registro público con los nombres consultados, y `deepseek-v3` pesa 404 GB.
