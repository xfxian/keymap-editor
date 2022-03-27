<template>
  <div id="picker">
    <selector
      class="choice"
      :class="{ active: keymapType === 'preset' }"
      v-model="source"
      label="Select Keyboard"
      :id="source"
      :choices="sourceChoices"
    />
    <p>-or-</p>
    <div>
      <load-user-keymap
        class="choice"
        :class="{ active: keymapType === 'user' }"
        @user-keymap="fetchUserKeyboard"
        :currentKeymapType="keymapType"
      />
      <div id="keymap-error" v-if="userKeymapError === true">
        <p>
          We seem to be unable to load your keymap. We currently only support
          keymap.json files that were previously saved from this site. (note
          that this zmk keymap editor is a custom port)
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
#picker {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}
#keymap-error {
  width: 300px;
  color: salmon;
}
#keymap-error p {
  font-size: x-small;
}
.choice {
  opacity: 0.4;
}
.choice.active {
  opacity: 1;
}
</style>

<script>
import { loadLayout } from "../layout.js";
import { loadDefaultKeymap, loadUserKeymap } from "../keymap.js";

import Selector from "./selector.vue";
import LoadUserKeymap from "./load-user-keymap.vue";
import { FIRMWARES } from "../constants/firmware.js";

export default {
  name: "KeyboardPicker",
  components: { Selector, LoadUserKeymap },
  emits: ["select"],
  data() {
    // before load, get from localStorage
    const lastKeyboardId = localStorage.getItem("pw-saved-keyboard-id");

    return {
      userKeymapError: false,
      keymapType: "preset", // preset or user
      sourceChoices: FIRMWARES,
      source: FIRMWARES.find((source) => source.id === lastKeyboardId)
        ? lastKeyboardId
        : FIRMWARES[1].id, // default for bt60 ansi
    };
  },
  mounted() {
    this.fetchDefaultKeyboard(this.source);
  },
  watch: {
    source(value) {
      localStorage.setItem("pw-saved-keyboard-id", value);
      this.fetchDefaultKeyboard(value);
    },
  },
  methods: {
    setKeymapType(type) {
      this.keymapType = type;
    },
    async fetchDefaultKeyboard(keyboardId) {
      this.setKeymapType("preset");
      this.userKeymapError = false;

      const [layout, keymap] = await Promise.all([
        loadLayout(keyboardId),
        loadDefaultKeymap(keyboardId),
      ]);

      this.handleKeyboardSelected({
        source: keyboardId,
        layout,
        keymap,
        type: "preset",
      });
    },
    async fetchUserKeyboard(keymapJson) {
      this.setKeymapType("user");
      this.userKeymapError = false;

      const keyboardId = keymapJson["pw-kbid"];
      if (!keyboardId) {
        console.warn("user keymap missing id error");
        this.userKeymapError = true;
        return;
      }

      const [layout, keymap] = await Promise.all([
        loadLayout(keyboardId).catch(() => {
          console.warn("user keyboard layout load error");
          this.userKeymapError = true;
        }),
        loadUserKeymap(keymapJson).catch(() => {
          console.warn("user keymap parse error");
          this.userKeymapError = true;
        }),
      ]);

      this.handleKeyboardSelected({
        source: keyboardId,
        layout,
        keymap,
        type: "user",
      });
    },
    handleKeyboardSelected(event) {
      const { source } = this;
      const { layout, keymap, ...rest } = event;

      const layerNames =
        keymap.layer_names || keymap.layers.map((_, i) => `Layer ${i}`);
      Object.assign(keymap, {
        layer_names: layerNames,
      });

      this.$emit("select", { source, layout, keymap, ...rest });
    },
  },
};
</script>

