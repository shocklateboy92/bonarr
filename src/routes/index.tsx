import PageLayout from "../components/shared/layouts/PageLayout";
import TVShowSearch from "../components/TVShowSearch";
import VolumeSearch from "../components/VolumeSearch";

const isManagMode = import.meta.env.VITE_BONARR_MEDIA_MODE === "manga";

export default function Home() {
  return (
    <PageLayout>
      {isManagMode ? <VolumeSearch /> : <TVShowSearch />}
    </PageLayout>
  );
}
