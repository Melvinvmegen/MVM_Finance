<template lang="pug">
v-row(justify="center")
  v-col(sm="12" md="8" lg="6" xl="4")
    v-card(class="pa-5 mt-5")
      v-card-title(class="headline")
        v-icon(color="error" x-large left) mdi-alert-circle-outline {{ $t("notFound.title") }}
      v-card-text {{ $t("notFound.message") }}
      v-card-actions
        v-spacer
        v-btn(raised color="primary" to="/")
          v-icon(left)mdi-home {{ $t("notFound.backHome") }}
        v-spacer
</template>
