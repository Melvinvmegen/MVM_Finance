<template lang="pug">
v-card(width="600")
  v-form(v-model="valid" @submit.prevent="handleSubmit" class="my-8")
    v-card-title.text-center.mb-4 {{ mutableModel?.id ? $t("pendingEmail.edit") : $t("pendingEmail.create") }}
    v-card-text
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-switch(:label='$t("pendingEmail.active")' v-model="mutableModel.CronTask.active" hide-details)
      v-row(justify="center")
        v-col(cols="12" sm="8")
          label {{ $t("pendingEmail.date") }}
          DateInput(v-model="mutableModel.CronTask.date")
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-text-field(:label='$t("pendingEmail.time")' v-model="mutableModel.CronTask.time" :rules="[$v.required()]")
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-text-field(:label='$t("pendingEmail.recipientEmail")' v-model="mutableModel.recipientEmail" :rules="[$v.required(), $v.isEmail()]")
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-text-field(:label='$t("pendingEmail.subject")' v-model="mutableModel.subject" :rules="[$v.required()]")
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-textarea(:label='$t("pendingEmail.content")' v-model="mutableModel.content" :rules="[$v.required()]")

    v-card-actions(class="justify-center")
      v-btn.bg-secondary.text-white.my-2(type="submit") {{ $t("pendingEmail.save") }}

</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { createPendingEmail, updatePendingEmail } from "../utils/generated/api-user";
import type { PendingEmail, CronTask } from "../../types/models";
type PendingEmailWithCron = PendingEmail & { CronTask: CronTask & { time: string } };

const props = defineProps({
  model: {
    type: Object as PropType<PendingEmailWithCron>,
    required: true,
  },
});
const valid = ref(false);
const mutableModel = reactive<PendingEmailWithCron>(props.model);
const loadingStore = useLoadingStore();
const emit = defineEmits(["close"]);

onMounted(async () => {
  mutableModel.CronTask.date = dayjs(props.model.CronTask.date || undefined).toDate();
  mutableModel.CronTask.time = dayjs(mutableModel.CronTask.date).format("HH:mm:ss");
});

async function handleSubmit(): Promise<void> {
  if (!valid.value) return;
  if (mutableModel.id) {
    await updatePendingEmail(mutableModel.id, mutableModel);
    useMessageStore().i18nMessage("success", "pendingEmail.updated");
  } else {
    await createPendingEmail(mutableModel);
    useMessageStore().i18nMessage("success", "pendingEmail.created");
  }
  emit("close");
  loadingStore.setLoading(false);
}
</script>
