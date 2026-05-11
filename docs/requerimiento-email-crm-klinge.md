# Requerimiento funcional: Gestión de plantillas de email y envíos desde CRM Klinge

## Objetivo

Implementar un módulo de gestión y envío de emails dentro del CRM Klinge, conectado al servicio de envío configurado en AWS, idealmente usando Amazon SES para el despacho de correos y, si aplica, Amazon SNS para eventos, notificaciones o seguimiento de estados.

El módulo debe permitir crear, administrar, previsualizar, probar y utilizar plantillas de email HTML con branding de Klinge, tanto para campañas segmentadas como para flujos automatizados orientados a conversión.

---

## Alcance funcional

### 1. Crear y administrar plantillas de email

El sistema debe permitir gestionar plantillas HTML personalizadas con el branding de Klinge.

Las plantillas deben considerar:

- Logo de Klinge.
- Colores corporativos.
- Tipografías y estilo visual de la marca.
- Estructura responsive para desktop y mobile.
- Mensajes comerciales enfocados en conversión.

Tipos de plantillas esperadas:

- Campañas comerciales.
- Carritos abandonados.
- Seguimiento comercial.
- Postventa.
- Automatizaciones.
- Recuperación de clientes.
- Confirmación de compra.
- Garantía.
- Recordatorios comerciales.

---

### 2. Previsualizar emails antes del envío

El módulo debe permitir validar visualmente cada email antes de activarlo en una campaña o flujo automatizado.

Debe incluir:

- Vista previa en formato desktop.
- Vista previa en formato mobile.
- Validación de asunto, remitente, enlaces, contenido y llamados a la acción.
- Revisión del diseño antes del envío real.

---

### 3. Enviar correos de prueba

El sistema debe permitir enviar emails de prueba a uno o varios destinatarios internos antes de ejecutar una campaña o automatización.

El comportamiento esperado debe ser similar a plataformas como Klaviyo o MailerLite.

El objetivo del envío de prueba es validar:

- Diseño visual.
- Enlaces.
- Textos.
- Asunto.
- Remitente.
- Correcta visualización en distintos dispositivos.

---

### 4. Seleccionar audiencias segmentadas para campañas

El CRM debe permitir elegir listados o segmentos de clientes para campañas masivas.

Criterios de segmentación esperados:

- Clientes.
- Prospectos.
- Carritos abandonados.
- Compras realizadas.
- Productos vistos.
- Ubicación.
- Estado del lead.
- Nivel de interés o score comercial.
- Otros filtros disponibles dentro del CRM.

---

### 5. Automatizar envíos por flujos

El módulo debe permitir usar plantillas específicas dentro de flujos automatizados.

Flujos iniciales sugeridos:

- Carrito abandonado.
- Recuperación de clientes.
- Seguimiento post cotización.
- Confirmación de compra.
- Postventa.
- Garantía.
- Recordatorios comerciales.

Cada flujo debe usar una plantilla HTML alineada al tono comercial de Klinge y orientada a convertir, recuperar oportunidades o mejorar la experiencia del cliente.

---

### 6. Mantener enfoque comercial y de conversión

Los emails deben estar diseñados para vender, recuperar oportunidades y aumentar la tasa de conversión.

Cada plantilla debe incluir llamados a la acción claros, por ejemplo:

- Cotizar por WhatsApp.
- Finalizar compra.
- Hablar con un ejecutivo.
- Ver productos.
- Retomar cotización.
- Agendar atención comercial.

---

## Integración técnica esperada

### Amazon SES

Amazon SES debe utilizarse como servicio principal para el envío de emails transaccionales, comerciales y automatizados.

Debe permitir:

- Envío de emails HTML.
- Envío de correos de prueba.
- Envío de campañas segmentadas.
- Envío desde remitentes validados.
- Manejo de remitente y nombre comercial de Klinge.

### Amazon SNS

Amazon SNS puede utilizarse, si aplica, para gestionar eventos asociados al ciclo de vida del correo.

Eventos esperados:

- Entrega.
- Rebote.
- Queja/spam.
- Fallo de envío.
- Notificaciones internas.
- Seguimiento de estados.

---

## Versión ejecutiva

Desarrollar un módulo de emails para el CRM Klinge que permita gestionar plantillas HTML con branding de marca, previsualizarlas, enviar correos de prueba y utilizarlas tanto en campañas segmentadas como en flujos automatizados, por ejemplo carritos abandonados, seguimiento comercial y postventa.

El sistema debe funcionar de forma similar a herramientas como Klaviyo o MailerLite, permitiendo seleccionar listas segmentadas de clientes, validar el diseño antes del envío y utilizar plantillas enfocadas en conversión, con colores, logo, estilo visual y mensajes comerciales propios de Klinge.

Además, el envío debe integrarse con AWS SES para el despacho de emails y, si corresponde, SNS para gestionar eventos, estados de entrega, rebotes o notificaciones asociadas al proceso.

---

## Criterios de aceptación iniciales

- El usuario puede crear una plantilla HTML desde el CRM.
- El usuario puede guardar y editar plantillas existentes.
- El usuario puede previsualizar una plantilla antes de enviarla.
- El usuario puede enviar un correo de prueba a uno o varios destinatarios.
- El usuario puede seleccionar una audiencia o segmento para una campaña.
- El sistema puede enviar una campaña usando AWS SES.
- El sistema puede usar una plantilla dentro de un flujo automatizado.
- El sistema registra historial básico de envíos.
- El sistema puede diferenciar estados como enviado, error, rebotado o entregado cuando la integración lo permita.
- Las plantillas mantienen identidad visual y foco comercial de Klinge.
