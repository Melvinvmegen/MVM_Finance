<template>
  <v-row justify="center">
    <v-col sm="12" md="8" lg="6" xl="4">
      <v-card class="pa-5 mt-5">
        <v-card-title class="headline">
          <v-icon color="error" x-large left>mdi-alert-circle-outline</v-icon>
          {{ $t("notFound.title") }}
        </v-card-title>
        <v-card-text>
          {{ $t("notFound.message") }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn raised color="primary" to="/">
            <v-icon left>mdi-home</v-icon>
            {{ $t("notFound.backHome") }}
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>
