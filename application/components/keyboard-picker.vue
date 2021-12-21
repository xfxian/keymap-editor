<template>
  <div>
    <selector
      v-model="source"
      label="Select Keyboard"
      :id="source"
      :choices="sourceChoices"
    />
  </div>
</template>

<script>
import { loadLayout } from "../layout.js";
import { loadKeymap } from "../keymap.js";

import Selector from "./selector.vue";

export default {
  name: "KeyboardPicker",
  components: { Selector },
  emits: ["select"],
  data() {
    const sourceChoices = [
      { keyboard: "BT60 v1", layout: "ANSI", id: "bt60v1_ansi" },
      { keyboard: "BT60 v1", layout: "ISO", id: "bt60v1_iso" },
      { keyboard: "BT60 v1", layout: "TSANGAN", id: "bt60v1_tsangan" },
      { keyboard: "BT60 v1", layout: "1U", id: "bt60v1_1u" },

      { keyboard: "BT60 v2", layout: "ANSI", id: "bt60v2_ansi" },
      { keyboard: "BT60 v2", layout: "ISO", id: "bt60v2_iso" },
      { keyboard: "BT60 v2", layout: "TSANGAN", id: "bt60v2_tsangan" },
      { keyboard: "BT60 v2", layout: "1U", id: "bt60v2_1u" },
    ];

    const selectedSource = localStorage.getItem("selectedSource");

    return {
      sourceChoices,
      source: sourceChoices.find((source) => source.id === selectedSource)
        ? selectedSource
        : null,
    };
  },
  mounted() {
    this.fetchLocalKeyboard(this.source);
  },
  watch: {
    source(value) {
      localStorage.setItem("selectedSource", value);
      this.fetchLocalKeyboard(value);
    },
  },
  methods: {
    async fetchLocalKeyboard(keyboardId) {
      const [layout, keymap] = await Promise.all([
        loadLayout(keyboardId),
        loadKeymap(keyboardId),
      ]);

      this.handleKeyboardSelected({ source: keyboardId, layout, keymap });
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

