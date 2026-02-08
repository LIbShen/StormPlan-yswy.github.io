import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TRANSLATIONS, MOCK_NEWS } from '../constants';
import { Bell, FileText, Megaphone, X, QrCode, Smartphone, Download, HelpCircle, Sparkles } from 'lucide-react';
import wechatQr from '../Official resources/公众号.png?url';
import miniProgramQr from '../Official resources/小程序.png?url';
import type { NewsItem } from '../types';

interface NewsProps {
  lang: 'zh' | 'en';
}

export const News: React.FC<NewsProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [activeModal, setActiveModal] = useState<null | 'faq' | 'news'>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setActiveModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const faqItems = useMemo(
    () => [
      {
        id: 'camera',
        q: '摄像头打不开/看不到画面怎么办？',
        a: '请在浏览器地址栏左侧的权限设置中允许“摄像头”。如果仍然不行，刷新页面或换一个浏览器再试。',
      },
      {
        id: 'sound',
        q: '参考视频没有声音？',
        a: '先确认系统音量与浏览器标签页未静音，再检查页面里的静音按钮。部分浏览器会拦截自动播放带声音，请点一下播放按钮。',
      },
      {
        id: 'sync',
        q: '动作同步率太低/识别不灵敏？',
        a: '建议让身体处于镜头中央，光线更亮一些，动作幅度稍大。孩子慢半拍也没关系，系统会自动宽容匹配。',
      },
      {
        id: 'riddle',
        q: '猜灯谜看不懂图标提示？',
        a: '点击“灯笼提示/作者提示/字形提示”会给出线索。提示每局最多使用 3 次，用得越少得分越高。',
      },
      {
        id: 'account',
        q: '想报名活动/获取更多教材？',
        a: '点击“联系我们”，扫码进入公众号与小程序，获取最新活动、教材与学习任务。',
      },
    ],
    []
  );

  const openNews = (item: NewsItem) => {
    setSelectedNews(item);
    setActiveModal('news');
  };

  const openFaq = () => {
    setActiveModal('faq');
  };

  const jumpToQr = () => {
    qrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setToast('二维码已在页面中展示');
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <Bell size={28} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">{t.menu_news}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="font-extrabold text-gray-800">官方咨询台</div>
            <div className="text-sm text-gray-500 mt-1">最新公告、活动报名、教材领取与客服咨询都在这里。</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 h-11 rounded-xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors"
            onClick={openFaq}
          >
            帮助中心
          </button>
          <button
            className="px-4 h-11 rounded-xl bg-primary text-white font-extrabold shadow-lg shadow-pink-500/20 hover:brightness-110 transition-all flex items-center gap-2"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText('吟诗舞韵');
                setToast('已复制：吟诗舞韵');
              } catch {
                setToast('复制失败，请手动复制：吟诗舞韵');
              }
            }}
          >
            <Smartphone size={18} />
            复制名称
          </button>
        </div>
      </div>

      <div ref={qrRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <div>
              <div className="font-extrabold text-gray-800">官方二维码</div>
              <div className="text-sm text-gray-500 mt-0.5">扫码进入公众号/小程序，获取活动、教材与客服帮助</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              className="px-4 h-11 rounded-xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors flex items-center gap-2"
              href={wechatQr}
              download="公众号二维码.png"
            >
              <Download size={18} />
              保存公众号
            </a>
            <a
              className="px-4 h-11 rounded-xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition-colors flex items-center gap-2"
              href={miniProgramQr}
              download="小程序二维码.png"
            >
              <Download size={18} />
              保存小程序
            </a>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-gray-800">公众号</div>
              <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">微信扫一扫</span>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <div className="w-full max-w-[260px] aspect-square rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                <img src={wechatQr} alt="公众号二维码" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 leading-relaxed">
              手机端：长按识别或先保存图片；电脑端：微信扫一扫对准二维码。
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-gray-800">小程序</div>
              <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">微信扫一扫</span>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <div className="w-full max-w-[260px] aspect-square rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                <img src={miniProgramQr} alt="小程序二维码" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 leading-relaxed">
              用小程序可领取教材、查看活动报名、同步学习任务与勋章进度。
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_NEWS.map(item => (
            <button
              key={item.id}
              className="w-full text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              onClick={() => openNews(item)}
            >
                <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-lg ${
                        item.type === 'EVENT' ? 'bg-pink-100 text-pink-600' :
                        item.type === 'NOTICE' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                    }`}>
                        {item.type === 'EVENT' && <Megaphone size={20} />}
                        {item.type === 'NOTICE' && <Bell size={20} />}
                        {item.type === 'RESOURCE' && <FileText size={20} />}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">{item.date}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{item.summary}</p>
                    </div>
                </div>
            </button>
        ))}
      </div>

      <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 mt-8">
          <h3 className="font-bold text-primary mb-2">💡 帮助中心</h3>
          <p className="text-sm text-gray-600 mb-4">遇到问题了吗？查看常见问题解答或联系客服。</p>
          <div className="flex gap-3">
              <button className="bg-white text-primary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50" onClick={openFaq}>
                常见问题
              </button>
              <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-pink-600" onClick={jumpToQr}>
                联系我们
              </button>
          </div>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120]">
          <div className="px-4 py-2 rounded-full bg-black/80 text-white text-sm font-bold shadow-2xl">{toast}</div>
        </div>
      )}

      {activeModal !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setActiveModal(null)} aria-label="关闭弹窗" />

          {activeModal === 'faq' && (
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-gray-800">常见问题</div>
                    <div className="text-xs text-gray-500 mt-0.5">快速解决常见使用问题</div>
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  onClick={() => setActiveModal(null)}
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3 max-h-[70vh] overflow-auto">
                {faqItems.map((item) => {
                  const open = expandedFaq === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`w-full text-left rounded-3xl border transition-all ${open ? 'bg-primary/10 border-primary/20' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                      onClick={() => setExpandedFaq((v) => (v === item.id ? null : item.id))}
                    >
                      <div className="p-5">
                        <div className="font-extrabold text-gray-800">{item.q}</div>
                        {open && <div className="mt-2 text-sm text-gray-600 leading-relaxed">{item.a}</div>}
                      </div>
                    </button>
                  );
                })}

                <div className="mt-4 bg-gray-50 border border-gray-100 rounded-3xl p-5">
                  <div className="font-extrabold text-gray-800">还没解决？</div>
                  <div className="mt-1 text-sm text-gray-600">可以直接扫码联系官方，我们会尽快回复。</div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      className="px-5 h-11 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all"
                      onClick={() => {
                        setExpandedFaq(null);
                        setActiveModal(null);
                        window.setTimeout(() => jumpToQr(), 0);
                      }}
                    >
                      查看二维码
                    </button>
                    <button
                      className="px-5 h-11 rounded-2xl bg-white border border-gray-200 text-gray-800 font-extrabold hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveModal(null)}
                    >
                      返回
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModal === 'news' && selectedNews && (
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center">
                    {selectedNews.type === 'EVENT' ? <Megaphone size={18} /> : selectedNews.type === 'NOTICE' ? <Bell size={18} /> : <FileText size={18} />}
                  </div>
                  <div>
                    <div className="font-extrabold text-gray-800">公告详情</div>
                    <div className="text-xs text-gray-500 mt-0.5">{selectedNews.date}</div>
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  onClick={() => setActiveModal(null)}
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <div className="text-xl font-extrabold text-gray-800">{selectedNews.title}</div>
                <div className="mt-3 text-gray-600 leading-relaxed">{selectedNews.summary}</div>
                <div className="mt-6 bg-primary/10 border border-primary/15 rounded-3xl p-5">
                  <div className="font-extrabold text-primary">想了解更多？</div>
                  <div className="mt-1 text-sm text-gray-600">扫码进入公众号/小程序，获取最新活动入口与教程。</div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      className="px-5 h-11 rounded-2xl bg-primary text-white font-extrabold hover:brightness-110 transition-all"
                      onClick={() => {
                        setActiveModal(null);
                        window.setTimeout(() => jumpToQr(), 0);
                      }}
                    >
                      查看二维码
                    </button>
                    <button
                      className="px-5 h-11 rounded-2xl bg-white border border-gray-200 text-gray-800 font-extrabold hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveModal(null)}
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
