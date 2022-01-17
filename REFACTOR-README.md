## TODO:

- find out what is ChipInput

steps:

- pick keyboard
- pick layout
- edit layout:
  - keypress
  - bluetooth
- save layout OR
- build layout

## rendering layout

- takes the layout prop and draws it according to this format

```json
{
    "label": "Enter",
    "row": 2,
    "col": 13,
    "x": 13.75,
    "y": 1,
    "w": 1.25,
    "h": 2
},
```

layout is used wholesale, but keymap has been parsed (encoded and decoded at the api)

## entire keybinding update handler logic is in key.vue

- application\components\key.vue

## saving

saving to json does:

- fetching the /api/keymap
- which calls the backend code generateKeymap
- sends back json
- which is turned into json
- and downloaded on user's browser

### notes:

- rename api to save keymap

## building

build does:

- fetching the /api/build
- which calls the backend code generateKeymap
- sends back text file
- fetching the builder endpoint (cloud run)
- receives a blog as a result
- that gets transformed into a uf2

### handle errors and loading states gracefully with state machines
