<script setup lang="ts">
import { logout } from "../../utils/generated/api-public";

onMounted(async () => {
  useLoadingStore().setLoading(true);
  await logout();
  document.location.href = "/";
});
</script>
