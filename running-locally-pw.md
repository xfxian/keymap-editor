1. get cross-env installed
    - with this directory at root (here), `npm install`

2. build vue
    - `cd application`
    - `npm install`
    - `npm run build`
    - you should now have a dist folder
    - you can now go back to root `cd ..`

3. test
    - `npm run dev`
    - this would open your keymap editor on localhost:8080
    - visit it and you should be able to see the corne layout on screen
    - to test it
        - change a key
        - click 'download keymap'
        - you should be able to get a json
        - click 'download firmware'
        - you should be able to see this app sending a request to the zmk builder on google cloud: "https://zmk-pw-builder-4u34d3yfla-de.a.run.app" (this is the equivalent to running github actions)
        - after a while you should get the uf2\

4. develop
    - `npm run dev` to start
    - in the directory api/zmk-config you should see a config folder. swap out the stuff inside and refresh the page to immediately see changes. rn it's looking for the /config, so you can rename it to other folders to swap it around.
    - just ctrl c when done