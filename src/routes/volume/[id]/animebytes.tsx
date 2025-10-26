import PageLayout from "../../../components/shared/layouts/PageLayout";
import AnimeBytesSearch from "../../../components/animebytes/AnimeBytesSearch";

export default function VolumeAnimeBytesSearch() {
  return (
    <PageLayout>
      <AnimeBytesSearch mangaMode={true} />
    </PageLayout>
  );
}
