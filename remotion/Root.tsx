import { Composition, Folder } from "remotion";
import { PostInstagram } from "./compositions/PostInstagram";

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="Social">
        <Composition
          id="PostInstagram"
          component={PostInstagram}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1080}
          defaultProps={{
            title: "REGENAPP",
            subtitle: "Ortobiológicos com evidência científica",
          }}
        />
      </Folder>
    </>
  );
};
