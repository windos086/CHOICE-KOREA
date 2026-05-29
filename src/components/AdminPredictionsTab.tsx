import React, { useState } from 'react';
import { Gamepad2, Plus, Edit3, Trash2, X, Sparkles, Filter, List, ArrowUp, ArrowDown } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { getApiUrl } from '../types';

export default function AdminPredictionsTab({
  globalSubcategories,
  setGlobalSubcategories,
  onAddPrediction,
  predictionCards,
  firebaseAvailable,
  db
}: any) {
  const [subCatMode, setSubCatMode] = useState<string>('politics');
  const [isLoading, setIsLoading] = useState(false);

  console.log("AdminPredictionsTab rendered, subCatMode:", subCatMode);

  // Subcategory states
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [subLabel, setSubLabel] = useState('');
  const [subChildren, setSubChildren] = useState<{label: string, key: string}[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Add prediction states
  const [isAddingPred, setIsAddingPred] = useState(false);
  const [predTitle, setPredTitle] = useState('');
  
  React.useEffect(() => {
    console.log("DEBUG: All Prediction Cards:", predictionCards);
  }, [predictionCards]);
  const [predOptions, setPredOptions] = useState<string[]>(['예', '아니오']);
  const [predEndAt, setPredEndAt] = useState('');
  const [predSubCategory, setPredSubCategory] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const startEdit = (card: any) => {
    setEditingCardId(card.id);
    setPredTitle(card.title);
    setPredOptions(card.options);
    setPredEndAt(card.endAt);
    setPredSubCategory(card.subCategory);
    setIsAddingPred(true);
  };
  const [predChildCategory, setPredChildCategory] = useState('');

  const submitSubcat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subLabel.trim()) return;

    const list = globalSubcategories[subCatMode] || [];
    const newList = [...list];
    
    const cleanChildren = subChildren.filter(c => c.label.trim() !== '').map(c => ({
      label: c.label.trim(),
      key: c.key || 'child_' + Math.random().toString(36).substring(2, 9)
    }));

    if (editIndex !== null) {
      newList[editIndex] = { ...newList[editIndex], label: subLabel.trim(), children: cleanChildren };
    } else {
      const generatedKey = 'sub_' + Math.random().toString(36).substring(2, 9);
      newList.push({ label: subLabel.trim(), key: generatedKey, count: '0', children: cleanChildren });
    }

    const updatedGlobalSubcategories = { ...globalSubcategories, [subCatMode]: newList };

    setGlobalSubcategories?.(updatedGlobalSubcategories);
    localStorage.setItem('CHOICE_KOREA_GLOBAL_SUBCATEGORIES', JSON.stringify(updatedGlobalSubcategories));

    if (firebaseAvailable && db) {
        try {
            await setDoc(doc(db, "app_config", "subcategories"), { list: updatedGlobalSubcategories }, { merge: true });
            alert("서버에 성공적으로 저장되었습니다.");
        } catch (error) {
            console.error("Firestore save error:", error);
            alert("서버 저장에 실패했습니다.");
        }
    }

    setIsEditingSub(false);
    setEditIndex(null);
    setSubLabel('');
    setSubChildren([]);
  };

  const deleteSubcat = async (idx: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      const list = globalSubcategories[subCatMode] || [];
      const newList = list.filter((_: any, i: number) => i !== idx);
      const updatedGlobalSubcategories = { ...globalSubcategories, [subCatMode]: newList };

      setGlobalSubcategories?.(updatedGlobalSubcategories);
      localStorage.setItem('CHOICE_KOREA_GLOBAL_SUBCATEGORIES', JSON.stringify(updatedGlobalSubcategories));

      if (firebaseAvailable && db) {
        try {
          await setDoc(doc(db, "app_config", "subcategories"), { list: updatedGlobalSubcategories }, { merge: true });
          alert("삭제가 서버에 정상 반영되었습니다.");
        } catch (error) {
          console.error("Firestore delete error:", error);
        }
      }
    }
  };

  const moveSubcatUp = async (idx: number) => {
    if (idx === 0) return;
    const list = globalSubcategories[subCatMode] || [];
    const newList = [...list];
    [newList[idx - 1], newList[idx]] = [newList[idx], newList[idx - 1]];
    const updatedGlobalSubcategories = { ...globalSubcategories, [subCatMode]: newList };

    setGlobalSubcategories?.(updatedGlobalSubcategories);
    localStorage.setItem('CHOICE_KOREA_GLOBAL_SUBCATEGORIES', JSON.stringify(updatedGlobalSubcategories));

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "app_config", "subcategories"), { list: updatedGlobalSubcategories }, { merge: true });
      } catch (error) {
        console.error("Firestore move up error:", error);
      }
    }
  };

  const moveSubcatDown = async (idx: number) => {
    const list = globalSubcategories[subCatMode] || [];
    if (idx === list.length - 1) return;
    const newList = [...list];
    [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
    const updatedGlobalSubcategories = { ...globalSubcategories, [subCatMode]: newList };

    setGlobalSubcategories?.(updatedGlobalSubcategories);
    localStorage.setItem('CHOICE_KOREA_GLOBAL_SUBCATEGORIES', JSON.stringify(updatedGlobalSubcategories));

    if (firebaseAvailable && db) {
      try {
        await setDoc(doc(db, "app_config", "subcategories"), { list: updatedGlobalSubcategories }, { merge: true });
      } catch (error) {
        console.error("Firestore move down error:", error);
      }
    }
  };

  const editSubcat = (idx: number, item: any) => {
    setEditIndex(idx);
    setSubLabel(item.label);
    setSubChildren(item.children || []);
    setIsEditingSub(true);
  };

  const handleAddSubChild = () => {
    setSubChildren([...subChildren, { label: '', key: '' }]);
  };

  const handleSubChildChange = (idx: number, val: string) => {
    const newChildren = [...subChildren];
    newChildren[idx].label = val;
    setSubChildren(newChildren);
  };

  const handleRemoveSubChild = (idx: number) => {
    setSubChildren(subChildren.filter((_, i) => i !== idx));
  };

  const submitPred = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = predOptions.filter(o => o.trim() !== '');
    if (!predTitle.trim() || validOptions.length < 2) {
      alert("질문 제목과 최소 2개의 정답 옵션이 필요합니다.");
      return;
    }
    
    // Normalize title: remove [ and ] and trim
    const normalizedTitle = predTitle.replace(/[\[\]]/g, '').trim();

    const result = await onAddPrediction({
      title: normalizedTitle,
      description: "",
      category: subCatMode,
      subCategory: predSubCategory,
      options: validOptions.map(o => o.trim()),
      endAt: predEndAt || new Date(Date.now() + 86400000).toISOString(),
      sourceUrl: ""
    }, true);

    if (result) {
      setIsAddingPred(false);
      setPredTitle('');
      setPredOptions(['예', '아니오']);
      setPredEndAt('');
      setPredSubCategory('');
      alert('예측 게임 등록 완료!');
    }
  };

  // Helper to add card
  const addValidatedPrediction = (card: any) => {
      onAddPrediction(card);
      return true;
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...predOptions];
    newOptions[idx] = val;
    setPredOptions(newOptions);
  };

  const addOption = () => {
    setPredOptions([...predOptions, '']);
  };

  const removeOption = (idx: number) => {
    setPredOptions(predOptions.filter((_, i) => i !== idx));
  };

  const categories = [
    { id: 'politics', label: '정치' },
    { id: 'sports', label: '스포츠' },
    { id: 'esports', label: 'E스포츠' },
    { id: 'economy', label: '경제' },
    { id: 'entertainment', label: '연예' },
    { id: 'news', label: '뉴스' },
    { id: 'broadcast', label: '방송' }
  ];

  const currentList = globalSubcategories?.[subCatMode] || [];

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      {/* Top Banner */}
      <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-600/10 text-blue-500 rounded-lg border border-blue-500/20">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">예측 마켓 전산 및 하위 카테고리 기획실</h3>
            <p className="text-gray-400 text-xs mt-0.5">새로운 예측 게임(마켓)을 발매하고 왼쪽 사이드바에 표시되는 서브 카테고리를 직관적으로 통제합니다.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Category Selector & Subcategories Manager */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 shadow-lg relative min-h-[500px]">
            <h4 className="flex items-center text-sm font-bold text-white mb-3">
              <Filter className="h-4 w-4 mr-2 text-blue-500" />
              활성 관리 카테고리 범주 선택 영역
            </h4>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSubCatMode(cat.id); setIsEditingSub(false); }}
                  className={`py-2 px-2 rounded font-bold text-[11px] transition-all ${
                    subCatMode === cat.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-[#181d2a] text-gray-400 border border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <hr className="border-gray-800 my-4" />

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-bold text-sm flex items-center">
                <List className="h-4 w-4 mr-2 text-indigo-400" />
                서브 카테고리 구성표 ({currentList.length}개)
              </h4>
             <button
               onClick={() => { setIsEditingSub(!isEditingSub); setEditIndex(null); setSubLabel(''); setSubChildren([]); }}
               className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center cursor-pointer"
             >
               <Plus className="h-3 w-3 mr-1" /> 추가
             </button>
            </div>

            {isEditingSub && (
              <form onSubmit={submitSubcat} className="bg-[#0f131a] p-3 rounded-lg border border-indigo-500/30 mb-4 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-indigo-400 font-extrabold">{editIndex !== null ? '서브 카테고리 수정' : '새 서브 카테고리 생성'}</span>
                  <X className="h-3 w-3 cursor-pointer text-gray-500 hover:text-white" onClick={() => setIsEditingSub(false)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold mb-1 block">노출명칭 (Label)</label>
                  <input type="text" className="w-full bg-[#181d2a] text-xs text-white border border-gray-800 px-2.5 py-1.5 rounded focus:border-indigo-500 focus:outline-none" placeholder="예: 야구" value={subLabel} onChange={e => setSubLabel(e.target.value)} required />
                </div>
                
                <div>
                  <label className="text-[10px] text-gray-400 font-bold mb-1 block">새끼카테고리</label>
                  <div className="space-y-2">
                    {subChildren.map((child, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input type="text" value={child.label} onChange={(e) => handleSubChildChange(idx, e.target.value)} className="flex-1 bg-[#181d2a] text-xs text-white border border-gray-800 px-2 rounded h-7 focus:border-indigo-500 py-0" placeholder="예: KBO" />
                        <button type="button" onClick={() => handleRemoveSubChild(idx)} className="text-red-500 hover:bg-red-900/20 p-1 rounded transition"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddSubChild} className="w-full py-1 text-[10px] text-indigo-400 border border-indigo-500/30 border-dashed rounded flex justify-center items-center hover:bg-indigo-900/20 transition">
                      <Plus className="h-3 w-3 mr-1" /> 새끼카테고리 추가
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded font-bold text-[11px] hover:bg-indigo-700 cursor-pointer">저장</button>
              </form>
            )}

            <div className="space-y-2">
              {currentList.length === 0 && <p className="text-center text-xs text-gray-500 py-6">등록된 서브카테고리가 없습니다.</p>}
              {currentList.map((item: any, idx: number) => (
                <div key={idx} className="bg-[#0a0d14] border border-gray-800 p-2.5 rounded flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-gray-200">{item.label}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.children?.map((c: any, i: number) => (
                         <span key={i} className="text-[9px] bg-neutral-800 text-gray-400 px-1.5 py-0.5 rounded border border-neutral-700">{c.label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1">
                    {idx > 0 && <button onClick={() => moveSubcatUp(idx)} className="p-1 bg-neutral-800 text-gray-400 rounded hover:text-white cursor-pointer" title="위로 구동"><ArrowUp className="h-3.5 w-3.5" /></button>}
                    {idx < currentList.length - 1 && <button onClick={() => moveSubcatDown(idx)} className="p-1 bg-neutral-800 text-gray-400 rounded hover:text-white cursor-pointer" title="아래로 이동"><ArrowDown className="h-3.5 w-3.5" /></button>}
                    <button onClick={() => editSubcat(idx, item)} className="p-1 bg-neutral-800 text-gray-400 rounded hover:text-white cursor-pointer" title="편집"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteSubcat(idx)} className="p-1 bg-red-900/20 text-red-500 rounded hover:bg-red-600 hover:text-white cursor-pointer" title="삭제"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Add Prediction Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#121620] border border-gray-800 rounded-xl p-5 shadow-lg">
             <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
              <h4 className="text-white font-bold text-sm flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
                선택된 [{categories.find(c => c.id === subCatMode)?.label}] 카테고리에 새 예측 게임 등록
              </h4>
              <button
                type="button"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    if (!globalSubcategories) {
                      alert("서브 카테고리 데이터가 없습니다.");
                      return;
                    }

                    const allTargetSubcats: any[] = [];
                    
                    // Flatten all categories to find ones with children
                    Object.entries(globalSubcategories).forEach(([parentCatId, subcats]) => {
                      const list = Array.isArray(subcats) ? subcats : [];
                      list.forEach((item: any) => {
                        if (item.children && item.children.length > 0) {
                          item.children.forEach((child: any) => {
                            allTargetSubcats.push({
                              topCategory: parentCatId, // 'sports', 'politics', etc.
                              parentCategory: item.label,
                              key: child.key,
                              subCategoryTitle: child.label
                            });
                          });
                        }
                      });
                    });

                    if (allTargetSubcats.length === 0) {
                      alert("새끼카테고리가 있는 카테고리가 없습니다.");
                      return;
                    }

                    alert(`${allTargetSubcats.length}개의 카테고리에 대해 AI 예측 게임 생성을 시작합니다... (최대 3분 소요)`);

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds

                    const res = await fetch(getApiUrl('/api/ai/generate-questions'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subcategories: allTargetSubcats }),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    const result = await res.json();
                    
                    if (res.ok && result.success && result.data) {
                      let addedCount = 0;
                      
                      // Define standard cleaning helper inside
                      const cleanString = (s: string) => {
                        if (!s) return "";
                        return s.replace(/[\[\]\s\(\)\-\_\,\.\:\'\"]/g, '').toLowerCase();
                      };

                      const existingKeys = new Set<string>();

                      // Map existing open/ongoing cards
                      (predictionCards || []).forEach((p: any) => {
                        if (p.status === 'open') {
                          existingKeys.add(cleanString(p.title));
                          const cleanOpts = (p.options || []).map((o: string) => cleanString(o)).sort().join(',');
                          if (cleanOpts) {
                            existingKeys.add("opts_" + cleanOpts);
                          }
                        }
                      });

                      const sanitizedAndFiltered: any[] = [];

                      result.data.forEach((card: any) => {
                        // A. Align/sanitize category mapping
                        let matchedTopCategory = card.category;
                        let matchedSubCategory = card.subCategory;
                        
                        let found = false;
                        Object.entries(globalSubcategories).forEach(([parentCatId, subcats]) => {
                          if (found) return;
                          const list = Array.isArray(subcats) ? subcats : [];
                          list.forEach((item: any) => {
                            if (found) return;
                            if (item.children && item.children.length > 0) {
                              item.children.forEach((child: any) => {
                                if (found) return;
                                if (child.key === card.subCategory) {
                                  matchedTopCategory = parentCatId;
                                  matchedSubCategory = child.key;
                                  found = true;
                                }
                              });
                            }
                          });
                        });
                        
                        if (!found) {
                          // Try label matching if key didn't match directly
                           Object.entries(globalSubcategories).forEach(([parentCatId, subcats]) => {
                            if (found) return;
                            const list = Array.isArray(subcats) ? subcats : [];
                            list.forEach((item: any) => {
                              if (found) return;
                              if (item.children && item.children.length > 0) {
                                item.children.forEach((child: any) => {
                                  if (found) return;
                                  if (child.label === card.subCategory || child.label === card.title) {
                                    matchedTopCategory = parentCatId;
                                    matchedSubCategory = child.key;
                                    found = true;
                                  }
                                });
                              }
                            });
                          });
                        }

                        const alignedCard = {
                          ...card,
                          category: matchedTopCategory,
                          subCategory: matchedSubCategory
                        };

                        // B. Check for Duplicates (both title and sorted options list)
                        const cleanTitle = cleanString(alignedCard.title);
                        const cleanOpts = (alignedCard.options || []).map((o: string) => cleanString(o)).sort().join(',');

                        const isTitleDup = existingKeys.has(cleanTitle);
                        const isOptsDup = cleanOpts ? existingKeys.has("opts_" + cleanOpts) : false;

                        if (!isTitleDup && !isOptsDup) {
                          existingKeys.add(cleanTitle);
                          if (cleanOpts) {
                            existingKeys.add("opts_" + cleanOpts);
                          }
                          sanitizedAndFiltered.push(alignedCard);
                        } else {
                          console.log("[Duplicate filtered in batch]", alignedCard.title);
                        }
                      });

                      // C. Register remaining non-duplicate games sequentially
                      for (const card of sanitizedAndFiltered) {
                        await onAddPrediction(card, false); // passing alertOnDuplicate = false
                        addedCount++;
                      }

                      alert(`${result.data.length}개의 분석 결과 중 중복 게임을 제외하고 ${addedCount}개의 새로운 예측 게임이 카테고리에 완벽히 분류 등록되었습니다!`);
                    } else {
                      console.error("AI Generation Response Error:", result);
                      alert(`AI 생성 실패: ${result.error || result.message || '알 수 없는 오류'}`);
                    }
                  } catch (e: any) {
                    console.error("AI Generation Catch Error:", e);
                    if (e.name === 'AbortError') {
                      alert("AI 생성 요청 시간이 초과되었습니다 (3분이 지나도 응답이 없습니다).");
                    } else {
                      const apiEndpoint = getApiUrl('/api/ai/generate-questions');
                      if (e.message?.includes('fetch') || e.message?.includes('NetworkError') || e.toString()?.includes('fetch')) {
                        alert(`❌ [API 연결 오류 - CORS/네트워크 제한]\n\n- 접속 도메인: ${window.location.hostname}\n- 백엔드 대상 주소: ${apiEndpoint}\n\n인증 기관(SSL), CORS 도메인 간 교차 오류 또는 임시 서버 인스턴스 지연으로 인해 API 서버와 연결할 수 없습니다. \n\n백엔드 서버 갱신(AIS 배포) 후 새로고침하여 재시도해 주세요.`);
                      } else {
                        alert(`요청 오류: ${e.message}`);
                      }
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className={`bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-md ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isLoading ? (
                  <>생성 중...</>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    AI 예측게임 전체 수동 생성 🤖
                  </>
                )}
              </button>
             </div>
             
             <form onSubmit={submitPred} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] text-gray-400 font-bold mb-1.5 block">서브 카테고리 기속 (분류)</label>
                    <select
                      value={predSubCategory}
                      onChange={e => setPredSubCategory(e.target.value)}
                      className="w-full bg-[#181d2a] text-sm text-white border border-gray-800 p-2.5 rounded focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- 카테고리 선택 없음 --</option>
                      {currentList.map((item: any) => {
                        if (item.children && item.children.length > 0) {
                          return (
                            <optgroup key={item.key} label={`[${item.label}]`}>
                              <option value={item.key}>{item.label} (전체)</option>
                              {item.children.map((c: any) => (
                                <option key={c.key} value={c.key}>ㄴ {c.label}</option>
                              ))}
                            </optgroup>
                          );
                        } else {
                          return <option key={item.key} value={item.key}>{item.label}</option>;
                        }
                      })}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 font-bold mb-1.5 block">예측 질문 제목</label>
                  <input type="text" className="w-full bg-[#181d2a] text-sm text-white border border-gray-800 p-2.5 rounded focus:border-indigo-500 focus:outline-none" placeholder="예: 트럼프는 이번 선거에서 이길 수 있을까?" value={predTitle} onChange={e => setPredTitle(e.target.value.replace(/[\[\]]/g, ''))} required />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 font-bold mb-1.5 block">정답 옵션 설정 (최소 2개)</label>
                  <div className="space-y-2">
                    {predOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input type="text" className="flex-1 bg-[#181d2a] text-sm text-white border border-gray-800 p-2.5 rounded focus:border-indigo-500 focus:outline-none" placeholder={`옵션 ${idx + 1}`} value={opt} onChange={e => handleOptionChange(idx, e.target.value)} required />
                        {predOptions.length > 2 && (
                          <button type="button" onClick={() => removeOption(idx)} className="p-2.5 bg-red-900/20 text-red-500 rounded hover:bg-red-600 hover:text-white transition cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addOption} className="mt-2 w-full py-2 bg-[#181d2a] hover:bg-gray-800 border border-dashed border-gray-700 text-gray-400 hover:text-white rounded text-xs font-bold transition flex justify-center items-center cursor-pointer">
                      <Plus className="h-3 w-3 mr-1" /> 정답 옵션 추가하기
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] text-gray-400 font-bold mb-1.5 block">마감일 (마감시간 포함)</label>
                    <input type="datetime-local" className="w-full bg-[#181d2a] text-xs text-white border border-gray-800 p-2.5 rounded focus:border-indigo-500 focus:outline-none" value={predEndAt} onChange={e => setPredEndAt(e.target.value)} />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 text-right">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-md cursor-pointer">
                    즉시 예측 시장 상장 🚀
                  </button>
                </div>
             </form>
          </div>
        </div>

      </div>
    </div>
  );
}
