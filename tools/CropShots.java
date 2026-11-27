import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;

/** 裁掉探针页右侧的调试面板，只保留 390 宽的手机画面（docs 展示用） */
public class CropShots {
    public static void main(String[] a) throws Exception {
        int w = a.length > 0 ? Integer.parseInt(a[0]) : 392;
        int h = a.length > 1 ? Integer.parseInt(a[1]) : 846;
        String[] names = {"01-focus", "02-pet", "03-shop", "04-onboarding", "05-backup"};
        for (String n : names) {
            File f = new File("docs/screenshots/" + n + ".png");
            if (!f.exists()) continue;
            BufferedImage src = ImageIO.read(f);
            int cw = Math.min(w, src.getWidth());
            int ch = Math.min(h, src.getHeight());
            BufferedImage cut = src.getSubimage(0, 0, cw, ch);
            BufferedImage out = new BufferedImage(cw, ch, BufferedImage.TYPE_INT_ARGB);
            out.getGraphics().drawImage(cut, 0, 0, null);
            ImageIO.write(out, "png", f);
            System.out.println(n + " " + src.getWidth() + "x" + src.getHeight() + " -> " + cw + "x" + ch);
        }
    }
}
