import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.File;

/**
 * 生成「番茄宠物」启动图标（各密度 mipmap PNG）。
 * 单文件运行：java GenIcon.java <resDir> <webIconsDir>
 */
public class GenIcon {

    static final int SS = 4; // 超采样倍数

    public static void main(String[] args) throws Exception {
        String resDir = args.length > 0 ? args[0] : "android/res";
        String webDir = args.length > 1 ? args[1] : "icons";

        String[][] dens = {
                {"mipmap-mdpi", "48"},
                {"mipmap-hdpi", "72"},
                {"mipmap-xhdpi", "96"},
                {"mipmap-xxhdpi", "144"},
                {"mipmap-xxxhdpi", "192"},
        };
        for (String[] d : dens) {
            int size = Integer.parseInt(d[1]);
            File dir = new File(resDir, d[0]);
            if (!dir.exists()) dir.mkdirs();
            BufferedImage img = draw(size);
            File out = new File(dir, "ic_launcher.png");
            ImageIO.write(img, "png", out);
            System.out.println("wrote " + out.getPath() + " " + size + "px");
        }

        String[][] fdens = {
                {"mipmap-mdpi", "108"},
                {"mipmap-hdpi", "162"},
                {"mipmap-xhdpi", "216"},
                {"mipmap-xxhdpi", "324"},
                {"mipmap-xxxhdpi", "432"},
        };
        for (String[] dd : fdens) {
            int size = Integer.parseInt(dd[1]);
            File dir = new File(resDir, dd[0]);
            if (!dir.exists()) dir.mkdirs();
            ImageIO.write(drawForeground(size), "png", new File(dir, "ic_foreground.png"));
        }
        System.out.println("wrote adaptive foregrounds");

        File w = new File(webDir);
        if (!w.exists()) w.mkdirs();
        ImageIO.write(draw(512), "png", new File(w, "icon-512.png"));
        ImageIO.write(draw(192), "png", new File(w, "icon-192.png"));
        System.out.println("wrote web icons");
    }

    static BufferedImage draw(int size) { return render(size, false); }

    static BufferedImage drawForeground(int size) { return render(size, true); }

    static BufferedImage render(int size, boolean fg) {
        int W = size * SS;
        BufferedImage img = new BufferedImage(W, W, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        double d = W; // 便捷
        if (fg) {
            // 自适应图标前景层：把图形缩到中间，四周留出系统裁切余量
            g.translate(d * 0.5, d * 0.5);
            g.scale(0.62, 0.62);
            g.translate(-d * 0.5, -d * 0.565);
        } else {
            // ---- 背景：圆角方 + 垂直渐变 ----
            RoundRectangle2D bg = new RoundRectangle2D.Double(0, 0, d, d, d * 0.235, d * 0.235);
            g.setClip(bg);
            g.setPaint(new GradientPaint(0, 0, new Color(26, 32, 42), 0, W, new Color(9, 11, 15)));
            g.fillRect(0, 0, W, W);
            // 顶部氛围光
            g.setPaint(new RadialGradientPaint(
                    new Point2D.Double(d * 0.5, d * 0.02), (float) (d * 0.62),
                    new float[]{0f, 1f},
                    new Color[]{new Color(255, 93, 93, 46), new Color(255, 93, 93, 0)}));
            g.fillRect(0, 0, W, W);
            g.setClip(null);
        }

        // ---- 猫耳（在番茄后面）----
        Color earOuter = new Color(214, 62, 62);
        Color earInner = new Color(255, 138, 138);
        g.setColor(earOuter);
        g.fill(poly(d, 0.175, 0.455, 0.315, 0.185, 0.475, 0.44));
        g.fill(poly(d, 0.825, 0.455, 0.685, 0.185, 0.525, 0.44));
        g.setColor(earInner);
        g.fill(poly(d, 0.245, 0.425, 0.325, 0.255, 0.425, 0.415));
        g.fill(poly(d, 0.755, 0.425, 0.675, 0.255, 0.575, 0.415));

        // ---- 番茄主体 ----
        g.setColor(new Color(255, 93, 93));
        g.fill(new Ellipse2D.Double(d * 0.125, d * 0.315, d * 0.75, d * 0.63));
        // 腹部暗面
        g.setColor(new Color(224, 73, 73));
        g.fill(new Ellipse2D.Double(d * 0.205, d * 0.615, d * 0.59, d * 0.31));
        // 高光
        g.setColor(new Color(255, 255, 255, 40));
        g.fill(new Ellipse2D.Double(d * 0.225, d * 0.355, d * 0.25, d * 0.17));
        g.setColor(new Color(255, 255, 255, 72));
        g.fill(new Ellipse2D.Double(d * 0.255, d * 0.385, d * 0.11, d * 0.07));

        // ---- 花萼（5 片叶尖放射状）----
        Color leaf = new Color(79, 208, 138);
        Color leafDark = new Color(58, 178, 112);
        double cx0 = 0.5, cy0 = 0.335;
        for (int i = -2; i <= 2; i++) {
            double deg = -90 + i * 34;
            g.setColor(Math.abs(i) == 2 ? leafDark : leaf);
            double[][] pts = sepal(cx0, cy0, deg, 0.155, 0.048, 21);
            Path2D p = new Path2D.Double();
            p.moveTo(d * pts[0][0], d * pts[0][1]);
            p.lineTo(d * pts[1][0], d * pts[1][1]);
            p.quadTo(d * (cx0 + Math.cos(Math.toRadians(deg)) * 0.05),
                    d * (cy0 + Math.sin(Math.toRadians(deg)) * 0.05),
                    d * pts[2][0], d * pts[2][1]);
            p.closePath();
            g.fill(p);
        }
        // 茎
        g.setColor(new Color(63, 169, 107));
        g.setStroke(new BasicStroke((float) (d * 0.026), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g.draw(new Line2D.Double(d * 0.5, d * 0.335, d * 0.5, d * 0.215));

        // ---- 猫脸：眼睛 ----
        double eyeY = 0.615;
        double[] cxes = {0.375, 0.625};
        for (double cx : cxes) {
            g.setColor(Color.WHITE);
            g.fill(new Ellipse2D.Double(d * (cx - 0.072), d * (eyeY - 0.072), d * 0.144, d * 0.144));
            g.setColor(new Color(24, 26, 32));
            g.fill(new Ellipse2D.Double(d * (cx - 0.042), d * (eyeY - 0.036), d * 0.084, d * 0.086));
            g.setColor(new Color(255, 255, 255, 235));
            g.fill(new Ellipse2D.Double(d * (cx - 0.014), d * (eyeY - 0.028), d * 0.032, d * 0.032));
        }

        // ---- 鼻子 + 嘴 ----
        Color mouth = new Color(201, 58, 58);
        g.setColor(mouth);
        g.fill(new Ellipse2D.Double(d * 0.468, d * 0.732, d * 0.064, d * 0.04));
        g.setStroke(new BasicStroke((float) (d * 0.018), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g.draw(new Arc2D.Double(d * 0.395, d * 0.725, d * 0.11, d * 0.09, 10, 85, Arc2D.OPEN));
        g.draw(new Arc2D.Double(d * 0.495, d * 0.725, d * 0.11, d * 0.09, 85, 85, Arc2D.OPEN));

        // ---- 腮红 ----
        g.setColor(new Color(255, 140, 140, 80));
        g.fill(new Ellipse2D.Double(d * 0.185, d * 0.695, d * 0.13, d * 0.08));
        g.fill(new Ellipse2D.Double(d * 0.685, d * 0.695, d * 0.13, d * 0.08));

        g.dispose();

        // 降采样
        BufferedImage out = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = out.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2.setComposite(AlphaComposite.SrcOver);
        g2.drawImage(img, 0, 0, size, size, null);
        g2.dispose();
        return out;
    }

    /** 一片萼片：中心点、角度（度，屏幕坐标 y 向下）、长度、根部半展开宽度、根部半角 */
    static double[][] sepal(double cx, double cy, double deg, double len, double rootW, double halfAng) {
        double a = Math.toRadians(deg);
        double ax = cx + Math.cos(a) * len, ay = cy + Math.sin(a) * len;
        double b1 = Math.toRadians(deg - halfAng), b2 = Math.toRadians(deg + halfAng);
        double p1x = cx + Math.cos(b1) * rootW, p1y = cy + Math.sin(b1) * rootW;
        double p2x = cx + Math.cos(b2) * rootW, p2y = cy + Math.sin(b2) * rootW;
        return new double[][]{{ax, ay}, {p1x, p1y}, {p2x, p2y}};
    }

    static Path2D poly(double d, double... xy) {
        Path2D.Double p = new Path2D.Double();
        p.moveTo(xy[0] * d, xy[1] * d);
        for (int i = 2; i + 1 < xy.length; i += 2) p.lineTo(xy[i] * d, xy[i + 1] * d);
        p.closePath();
        return p;
    }
}
