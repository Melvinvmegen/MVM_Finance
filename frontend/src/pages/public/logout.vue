<script setup lang="ts">
import { logout } from "@/utils/generated/api-auth";
const route = useRoute();

onMounted(async () => {
  useLoadingStore().setLoading(true);
  await logout();
  document.location.href = "/";
});
</script>
