<script>
import Initialize from "./initialize.vue";
import Keymap from "./keymap.vue";
import KeyboardPicker from "./keyboard-picker.vue";
import Spinner from "./spinner.vue";
import Modal from "./modal.vue";
import DialogBox from "./dialog-box.vue";

import * as config from "../config";
import github from "./github/api";

export default {
  components: {
    keymap: Keymap,
    KeyboardPicker,
    Initialize,
    Spinner,
    Modal,
    DialogBox,
  },
  data() {
    return {
      config,
      source: null,
      sourceOther: null,
      layout: [],
      keymap: {},
      editingKeymap: {},
      saving: false,
      downloading: false,
      buildingKeymap: false,
      buildError: false,
      queueFullError: false,
      modalDismissed: false,
      terminalOpen: false,
      socket: null,
      buildRequestTimestamp: new Date(Date.now()).toISOString(),
    };
  },
  methods: {
    handleKeyboardSelected({ source, layout, keymap, ...other }) {
      this.source = source;
      this.sourceOther = other;
      this.layout.splice(0, this.layout.length, ...layout);
      Object.assign(this.keymap, keymap);
      this.editingKeymap = {};
    },
    handleUpdateKeymap(keymap) {
      Object.assign(this.editingKeymap, keymap);
    },
    async handleCommitChanges() {
      const { repository, branch } = this.sourceOther.github;

      this.saving = true;
      await github.commitChanges(
        repository,
        branch,
        this.layout,
        this.editingKeymap
      );
      this.saving = false;
      Object.assign(this.keymap, this.editingKeymap);
      this.editingKeymap = {};
    },
    handleCompile() {
      this.downloading = true;
      fetch("/api/editor/keymap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: this.source, keymap: this.editingKeymap }),
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          const data = JSON.stringify(res);
          const blob = new Blob([data], { type: "text/plain" });

          let a = document.createElement("a");
          a.download = "keymap.json";
          a.href = window.URL.createObjectURL(blob);
          a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");

          const event = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          return a.dispatchEvent(event);
        })
        .then((_) => {
          this.downloading = false;
        });
    },
    handleBuild() {
      this.buildingKeymap = true;
      fetch("/api/editor/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: this.source, keymap: this.editingKeymap }),
      })
        .then(async (res) => {
          if (!res.ok)
            throw new Error("Failed at step 1 of 2: keymap generation.");

          const generatedKeymap = await res.text();
          const keyboard = this.source;

          this.buildRequestTimestamp = new Date(Date.now()).toISOString();
          const BUILDER_API_ENDPOINT =
            "https://zmk-pw-builder-uoxcukab3q-lz.a.run.app";
          // const BUILDER_API_ENDPOINT = "https://zmk-pw-builder-4u34d3yfla-de.a.run.app"; // panzerstadt-prod
          // const BUILDER_API_ENDPOINT = "http://localhost:8080";

          return fetch(BUILDER_API_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              keymapAsString: generatedKeymap,
              keyboardId: keyboard,
            }),
          });
        })
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 429 || res.status === 503) {
              this.queueFullError = true;
            }
            throw new Error(
              "Failed at step 2 of 2: uf2 compilation: too many requests to cloud builder."
            );
          }

          const blobResult = await res.blob();
          const blob = new Blob([blobResult]);

          let a = document.createElement("a");
          a.download = "keymap.uf2";
          a.href = window.URL.createObjectURL(blob);
          a.dataset.downloadurl = [
            "application/octet-stream",
            a.download,
            a.href,
          ].join(":");

          const event = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          return a.dispatchEvent(event);
        })
        .then((_) => {
          this.buildingKeymap = false;
        })
        .catch((err) => {
          console.warn(err);
          this.buildError = true;
          this.buildingKeymap = false;
        });
    },
  },
};
</script>

<template>
  <initialize>
    <keyboard-picker @select="handleKeyboardSelected" />

    <template v-if="keymap.keyboard">
      <keymap
        :layout="layout"
        :keymap="editingKeymap.keyboard ? editingKeymap : keymap"
        @update="handleUpdateKeymap"
      />
      <div id="actions">
        <button
          v-text="`Download Keymap`"
          id="compile"
          :disabled="
            !this.editingKeymap.keyboard || downloading || buildingKeymap
          "
          @click="handleCompile"
        />

        <button
          id="compile"
          :disabled="
            !this.editingKeymap.keyboard || downloading || buildingKeymap
          "
          @click="handleBuild"
        >
          <template v-if="!buildingKeymap">Download Firmware </template>
          <div v-if="buildingKeymap">
            <spinner /> <span>building firmware...</span>
          </div>
        </button>

        <modal v-if="!modalDismissed && buildingKeymap && !buildError">
          <dialog-box
            :dismissText="'Cool'"
            @dismiss="this.modalDismissed = true"
          >
            <h2>This may take a while... <spinner /></h2>
            <p>
              we are sending your keymap over to our cloud build instance in
              order to carefully craft your keymap.uf2 file.
            </p>
            <p>this may take up to 3 minutes on a good day.</p>
            <p>
              please keep this page open so that we can send you the file when
              we're done!
            </p>
          </dialog-box>
        </modal>

        <modal v-if="!buildingKeymap && buildError">
          <dialog-box :dismissText="''">
            <h2 id="err">Oopsie!</h2>
            <p>
              Ok... so there seems to be an issue with our firmware builder.
            </p>
            <p>Would you be a dear and ping us on our discord about it?</p>
            <p>Please mention the time when this happened!</p>
            <small
              ><strong>{{ buildRequestTimestamp }}</strong></small
            >
            <br />
            <br />
          </dialog-box>
        </modal>

        <modal v-if="!buildingKeymap && queueFullError">
          <dialog-box :dismissText="''">
            <h2 id="err">Oopsie!</h2>
            <p>
              So it seems we have to many build requests hitting our builder
              server.
            </p>
            <p>Perhaps try again in about 5 minutes?</p>
            <p>
              If this keeps happening to you, feel free to give us a ping on our
              discord with your timestamp:
            </p>
            <small
              ><strong>{{ buildRequestTimestamp }}</strong></small
            >
            <br />
            <br />
          </dialog-box>
        </modal>
      </div>
    </template>

    <a class="github-link" href="https://github.com/nickcoutsos/keymap-editor">
      custom port of <i class="fab fa-github" />/nickcoutsos/keymap-editor
    </a>
  </initialize>
</template>

<style scoped>
button {
  cursor: pointer;
  background-color: var(--hover-selection);
  color: white;

  font-size: 16px;
  border: none;
  border-radius: 5px;
  padding: 5px;
  margin: 2px;
}

button[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}

.github-link {
  display: inline-block;
  position: absolute;
  z-index: 100;
  bottom: 5px;
  left: 5px;
  font-size: 110%;
  font-style: italic;
  background-color: white;
  border-radius: 20px;
  padding: 5px 10px;
  text-decoration: none;

  color: royalblue;
}

#err {
  color: salmon;
}
</style>
