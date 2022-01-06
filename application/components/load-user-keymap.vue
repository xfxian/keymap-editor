<template>
  <div class="uploader">
    <label>Load Keymap</label>
    <input
      accept=".json"
      ref="file"
      v-on:change="handleFileUpload()"
      type="file"
    />
  </div>
</template>

<style scoped>
.uploader {
  display: inline-block;
  width: auto;
  margin: 5px;
}

.uploader label {
  display: block;
  width: 100%;
  font-size: 120%;
  color: #555;
  margin-bottom: 3px;
}
</style>

<script>
import { ref } from "vue";

export default {
  name: "LoadUserKeymap",
  emits: ["user-keymap"],
  props: {
    currentKeymapType: String,
  },
  watch: {
    currentKeymapType(value) {
      // if user reselects preset keymap
      // after having uploaded their own, clear
      // user input
      if (value === "preset") {
        this.$refs.file.value = null;
      }
    },
  },
  setup(props, { emit }) {
    const file = ref(null);

    const handleFileUpload = async () => {
      const reader = new FileReader();
      const keymapFile = file.value.files[0];

      reader.onload = function (e) {
        const jsonString = e.target.result;
        // pass to parent
        emit("user-keymap", JSON.parse(jsonString));
      };

      reader.readAsText(keymapFile);
    };

    return {
      handleFileUpload,
      file,
    };
  },
};
</script>