# Table of Contents

- [Account](#account)
    - [/create-account](#create-account)
    - [/delete-account](#delete-account)
    - [/edit-account](#edit-account)
    - [/get-account](#get-account)
- [Session](#session)
    - [/login](#login)
    - [/new-session](#new-session)
- [Schedule](#schedule)
    - [/create-schedule](#create-schedule)
    - [/delete-schedule](#delete-schedule)
    - [/edit-schedule](#edit-schedule)
    - [/get-schedule](#get-schedule)
    - [/list-schedule](#list-schedule)
    - [/subscribe-schedule](#subscribe-schedule)
    - [/unsubscribe-schedule](#unsubscribe-schedule)
- [Reminder](#reminder)
    - [/create-reminder](#create-reminder)
    - [/delete-reminder](#delete-reminder)
    - [/edit-reminder](#edit-reminder)
    - [/get-reminder](#get-reminder)

## Account

### /create-account

> Create a new account

Method: POST

Request Body:

```js
{
    number: string, // 10 <= length <= 16, Account number
    password: string, // 0 < length <= 36, Account password
    remindHour: number, // 0 <= x <= 23, When to remind (hour)
    remindWhen: number, // 0 <= x <= 7, When to start reminding (in day)
}
```

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /delete-account

> Delete account

Method: POST

Request Body:

```js
{
    number: string, // 10 <= length <= 16
    password: string, // 0 < length <= 36
}
```

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /edit-account

> Edit account info

Method: POST

Header: `Authorization: Bearer <sessionID>`

Request Body:

```js
{
    number?: string, // 10 <= length <= 16
    password?: string, // 0 < length <= 36
    remindHour?: number, // 0 <= x <= 23
    remindWhen?: number, // 0 <= x <= 7
}
```

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /get-account

> Get account info

Method: GET

Header: `Authorization: Bearer <sessionID>`

Response Body:

```js
{
    number: string,
    remindHour: number,
    remindWhen: number,
    code: number, // Status code
    message: string // Status message
}
```

## Session

### /login

> Login to session

Method: POST

Request Body:

```js
{
    number: string, // 10 <= length <= 16
    password: string, // 0 < length <= 36
}
```

Response Body:

```js
{
    id: string, // Session ID
    exp: Date, // Session expiration date
    code: number, // Status code
    message: string // Status message
}
```

### /new-session

> Renew session

Method: GET

Header: `Authorization: Bearer <sessionID>`

Response Body:

```js
{
    id: string, // Session ID
    exp: Date, // Session expiration date
    code: number, // Status code
    message: string // Status message
}
```

## Schedule

### /create-schedule

> Create a new schedule

Method: POST

Header: `Authorization: Bearer <sessionID>`

Request Body:

```js
{
    name: string, // 0 < length <= 36, Schedule name
    types: string[] // 0 < string-length <= 36, Schedule reminder types
}
```

Response Body:

```js
{
    id: string, // Schedule ID
    code: number, // Status code
    message: string // Status message
}
```

### /delete-schedule

> Delete a schedule

Method: GET

Header: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /edit-schedule

> Edit a schedule

Method: POST

Header: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Request Body:

```js
{
    name?: string, // 0 < length <= 36
    types?: {
        add: string[], // 0 < string-length <= 36, Add a type by name
        remove: string[], // 0 < string-length <= 36, Remove a type by name
        modify: {
            old: string, // 0 < length <= 36, Old type name to modify
            new: string // 0 < length <= 36, New type name to set
        }[]
    },
    editors?: {
        add: string[], // 0 < string-length <= 36, Add an editor by number
        remove: string[], // 0 < string-length <= 36, Remove an editor by number
    }
}
```

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /get-schedule

> Get a schedule info

Method: GET

Header?: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Response Body:

```js
{
    id: string, // Schedule ID
    name: string, // Schedule name
    types: string[], // Schedule reminder types
    subscribed: boolean, // Is the user subscribed to the schedule
    editable: boolean, // Is the user an editor of the schedule
    editors?: string[], // Schedule editor numbers, exists if user is owner
    code: number, // Status code
    message: string // Status message
}
```

### /list-schedule

> Get the user owned, editable, or subscribed schedules

Method: GET

Header: `Authorization: Bearer <sessionID>`

Response Body:

```js
{
    schedules: {
        id: string, // Schedule ID
        name: string, // Schedule name
    }[],
    code: number, // Status code
    message: string // Status message
}
```

### /subscribe-schedule

> Subscribe to a schedule

Method: GET

Header: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /unsubscribe-schedule

> Unsubscribe from a schedule

Method: GET

Header: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

## Reminder

### /create-reminder

> Create a reminder

Method: POST

Header: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Request Body:

```js
{
    type: string, // 0 < length <= 36, Reminder type
    date: Date, // Reminder date
    description?: string, // Reminder description
}
```

Response Body:

```js
{
    id: string, // Reminder ID
    code: number, // Status code
    message: string // Status message
}
```

### /delete-reminder

> Delete a reminder

Method: POST

Header: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Request Body:

```js
{
    id: string, // Reminder ID
    type: string // 0 < length <= 36, Reminder type
}
```

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /edit-reminder

> Edit a reminder

Method: POST

Header: `Authorization: Bearer <sessionID>`

Query: `scheduleId=<scheduleID>`

Request Body:

```js
{
    id: string, // Reminder ID
    type?: string, // 0 < length <= 36, Reminder type
    date?: Date, // Reminder date
    done?: boolean, // Whether the task is done
    description?: string | null // Reminder description
}
```

Response Body:

```js
{
    code: number, // Status code
    message: string // Status message
}
```

### /get-reminder

> Get reminders

Method: GET

Query:
- `scheduleId=<scheduleID>`
- either `type=<reminderType>` and `done=<boolean>`
- or `day=<number>`

Response Body:

```js
{
    reminders: {
        id: string, // Reminder ID
        type: string, // Reminder type
        date: Date, // Reminder date
        done: boolean, // Whether the task is done
        description?: string // Reminder description
    }[],
    code: number, // Status code
    message: string // Status message
}
```
