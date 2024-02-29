<template lang="pug">
v-card(width="600")
  v-form(v-model="valid" @submit.prevent="handleSubmit" class="my-8")
    v-card-title.text-center.mb-4 {{ mutableModel?.id ? $t("pendingEmail.edit") : $t("pendingEmail.create") }}
    v-card-text
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-switch(:label='$t("pendingEmail.active")' v-model="mutableModel.cron_task.active" hide-details)
      v-row(justify="center")
        v-col(cols="12" sm="8")
          label {{ $t("pendingEmail.date") }}
          DateInput(v-model="mutableModel.cron_task.date")
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-text-field(:label='$t("pendingEmail.time")' v-model="mutableModel.cron_task.time" :rules="[$v.required()]")
      v-row(justify="center")
        v-col(cols="12" sm="8")
          v-text-field(:label='$t("pendingEmail.recipientEmail")' v-model="mutableModel.recipient_email" :rules="[$v.required(), $v.isEmail()]")
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
import type { pending_email, cron_task } from "../../types/models";
type PendingEmailWithCron = pending_email & { cron_task: cron_task & { time: string } };

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
  mutableModel.cron_task.date = dayjs(props.model.cron_task.date || undefined).toDate();
  mutableModel.cron_task.time = dayjs(mutableModel.cron_task.date).format("HH:mm:ss");
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
