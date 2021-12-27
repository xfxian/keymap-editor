<script>
import Initialize from "./initialize.vue";
import Keymap from "./keymap.vue";
import KeyboardPicker from "./keyboard-picker.vue";
import Spinner from "./spinner.vue";

import * as config from "../config";
import github from "./github/api";

export default {
  components: {
    keymap: Keymap,
    KeyboardPicker,
    Initialize,
    Spinner,
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
      terminalOpen: false,
      socket: null,
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
      this.downloading = true;
      fetch("/api/editor/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: this.source, keymap: this.editingKeymap }),
      })
        .then(async (res) => {
          const generatedKeymap = await res.text();

          console.log("the payload", generatedKeymap, typeof generatedKeymap);

          const BUILDER_API_ENDPOINT =
            "https://zmk-pw-builder-uoxcukab3q-lz.a.run.app";
          // const BUILDER_API_ENDPOINT = "https://zmk-pw-builder-4u34d3yfla-de.a.run.app"; // panzerstadt-prod
          // const BUILDER_API_ENDPOINT = "http://localhost:8080";

          return fetch(BUILDER_API_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ keymapAsString: generatedKeymap }),
          });
        })
        .then(async (res) => {
          const blobResult = await res.blob();
          const blob = new Blob([blobResult]);

          let a = document.createElement("a");
          a.download = "bt60.uf2";
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
          this.downloading = false;
        })
        .catch((err) => {
          console.warn(err);
          this.downloading = false;
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
          :disabled="!this.editingKeymap.keyboard || downloading"
          @click="handleCompile"
        />

        <button
          id="compile"
          :disabled="!this.editingKeymap.keyboard || downloading"
          @click="handleBuild"
        >
          <template v-if="!downloading">Download Firmware </template>
          <div v-if="downloading">
            <spinner /> <span>building firmware...</span>
          </div>
        </button>

        <button
          v-if="source === 'github'"
          @click="handleCommitChanges"
          :disabled="!this.editingKeymap.keyboard"
          title="Commit keymap changes to GitHub repository"
        >
          <template v-if="saving">Saving </template>
          <template v-else>Commit Changes</template>
          <spinner v-if="saving || downloading" />
        </button>
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
</style>
